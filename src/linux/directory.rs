use std::{fs::{self, create_dir_all, File, Metadata}, path::PathBuf, process::Command, time::UNIX_EPOCH};

use chrono::{DateTime, Utc};
use gtk::{gio::{Cancellable, FileCopyFlags}, prelude::FileExt};
use serde::{Deserialize, Serialize};

use crate::{
    directory::DirectoryItem, error::Error, extended_items::Version, request_error::RequestError, str::StrExt};
use crate::directory::get_extension;

use super::iconresolver::get_geticon_py;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictItem {
	name: String,
	icon_path: Option<String>,
    size: u64,
    time: Option<DateTime<Utc>>,
    target_size: u64,
    target_time: Option<DateTime<Utc>>
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OnEnter {
    path: String
}

impl ConflictItem {
    pub fn from(_: &str, _: &str, item: &DirectoryItem, metadata: &Metadata)->Self {
        let target_size = metadata.len();
        let target_time =  metadata.modified()
                    .ok()
                    .and_then(|t|t.duration_since(UNIX_EPOCH).ok())
                    .map(|d|DateTime::from_timestamp_nanos(d.as_nanos() as i64)); 
        Self {
            name: item.name.clone(),
            icon_path: item.icon_path.clone(),
            size: item.size,
            time: item.time,
            target_size,
            target_time
        }
    }
}

pub fn is_hidden(name: &str, _: &Metadata)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}

pub fn get_icon_path(name: &str, _path: &str)->Option<String> {
    get_extension(name).map(|e|e.to_string())
}

pub fn get_icon(path: &str)->Result<(String, Vec<u8>), Error> {
   
    fn run_cmd(path: &str)->Result<String, Error> {
        let geticon_py = get_geticon_py();
        let output = Command::new("python3")
            .arg(geticon_py)
            .arg(path)
            .output()
            ?.stdout;
        Ok(String::from_utf8(output)
            ?.trim()
            .to_string())
    }

    let icon_path = run_cmd(path)?;
    if icon_path.len() > 0 {
        icon_path.clone()
    } else {
        run_cmd("")?
    };
    let icon = fs::read(&icon_path)?;
    Ok((icon_path.clone(), icon))
}

pub fn get_version(_: &str, _: &str) -> Option<Version> {
    None
}

pub fn mount(path: &str)->String {
    Command::new("udisksctl")
        .arg("mount")
        .arg("-b")
        .arg(format!("/dev/{path}"))
        .output()
        .inspect_err(|e|println!("Could not mount: {e}"))
        .ok()
        .and_then(|output|String::from_utf8(output.stdout).ok())
        .as_deref()
        .and_then(|output| output.substr_after(" at "))
        .map(|s|s.trim())
        .unwrap_or(path)
        .to_string()
}

pub fn update_directory_item(item: DirectoryItem, metadata: &Metadata)->DirectoryItem {
    let size = metadata.len();
    let time =  metadata.modified()
                .ok()
                .and_then(|t|t.duration_since(UNIX_EPOCH).ok())
                .map(|d|DateTime::from_timestamp_nanos(d.as_nanos() as i64)); 
    DirectoryItem { size, time, ..item }
}

pub trait StringExt {
    fn clean_path(&self) -> String;
}

pub fn move_item(source_file: &PathBuf, target_file: &PathBuf)->Result<(), RequestError> {

    if let Some(p) = target_file.parent() {
        if let Ok(true) = fs::exists(p) {}
        else {
            create_dir_all(p)?
        }
    }
    
    gtk::gio::File::for_path(source_file).move_(&gtk::gio::File::for_path(target_file), 
        FileCopyFlags::OVERWRITE | FileCopyFlags::NO_FALLBACK_FOR_MOVE, None::<&Cancellable>, None)?;
    Ok(())
}

pub fn copy_attributes(source_file: &File, target_file: &File)->Result<(), RequestError> {
    let meta = source_file.metadata()?;
    let modified = meta.modified()?;
    target_file.set_modified(modified)?;
    target_file.set_permissions(meta.permissions())?;
    Ok(())
}

pub fn on_enter(input: OnEnter)->Result<(), RequestError> {
    Command::new("xdg-open")
        .arg(format!("{}", input.path))
        .spawn()?;
    Ok(())
}

impl StringExt for String {
    fn clean_path(&self) -> String {
        self.clone()
    }
}
