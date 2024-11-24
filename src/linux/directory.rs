use std::{fs::{self, metadata, Metadata}, path::PathBuf, process::Command, time::UNIX_EPOCH};

use chrono::{DateTime, Utc};
use gtk::gio::{prelude::*, Cancellable, FileCopyFlags};
use gtk::gio::File;
use serde::Serialize;

use crate::{
    directory::{try_copy_lock, CopyItem, CopyItems, DirectoryItem, JobType}, error::Error, extended_items::{
        GetExtendedItems, Version
    }, progresses::{CurrentProgress, TotalProgress}, request_error::{ErrorType, RequestError}, 
    str::StrExt};
use crate::directory::get_extension;

use super::{iconresolver::get_geticon_py, remote::copy_from_remote};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictItem {
	name: String,
	icon_path: Option<String>,
    size: u64,
    time: Option<DateTime<Utc>>,
    //version?: Version
    target_size: u64,
    target_time: Option<DateTime<Utc>>
    //targetVersion?: Version
}

impl ConflictItem {
    pub fn from(item: &DirectoryItem, metadata: &Metadata)->Self {
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

pub fn get_version(_: &GetExtendedItems, _: &String) -> Option<Version> {
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

pub fn copy_items(input: CopyItems)->Result<(), RequestError> {

    let _binding = try_copy_lock()?;

    let items: Vec<(&CopyItem, u64)> = input.items.iter().map(|item|
        (item, metadata(PathBuf::from(&input.path).join(&item.name))
            .ok()
            .map(|m| m.len()) 
            .unwrap_or(item.size)))
            .collect();
    
    let total_progress = TotalProgress::new(
        items.iter().fold(0u64, |curr, (_, i)|i + curr), 
        input.items.len() as u32, 
        input.job_type == JobType::Move
    );

    for (file, file_size) in items {
        let current_progress = CurrentProgress::new(&total_progress, &file.name, file_size);
        match input.job_type {
            JobType::Copy => copy_item(false, &input, &file.name, &current_progress),
            JobType::Move => copy_item(true, &input, &file.name, &current_progress),
            JobType::CopyFromRemote => copy_from_remote(false, &input, &file.name, &current_progress),
            _ => return Err(RequestError { status: ErrorType::NotSupported })
        }?;
    }
    Ok(())
}

pub trait StringExt {
    fn clean_path(&self) -> String;
}

pub fn copy_item(mov: bool, input: &CopyItems, file: &str, progress: &CurrentProgress)->Result<(), RequestError> {
    let source_file = PathBuf::from(&input.path).join(file);
    let target_file = PathBuf::from(&input.target_path).join(file);
    reset_copy_cancellable();
    if !mov {
        File::for_path(source_file).copy(&File::for_path(target_file), FileCopyFlags::OVERWRITE, 
        get_copy_cancellable().as_ref(), Some(&mut move |s, _| progress.send_bytes(s as u64)
        ))?;
    } else {
        File::for_path(source_file).move_(&File::for_path(target_file), FileCopyFlags::OVERWRITE, 
        get_copy_cancellable().as_ref(), Some(&mut move |s, _|progress.send_bytes(s as u64)
        ))?;
    }
    Ok(())
}

pub fn reset_copy_cancellable() {
    unsafe { COPY_CANCELLABLE.replace(Cancellable::new()) }; 
}

pub fn get_copy_cancellable()->Option<Cancellable> {
    unsafe { COPY_CANCELLABLE.clone() }
}

pub fn cancel_copy() {
    unsafe { COPY_CANCELLABLE.clone().inspect(|c|c.cancel())};
}

impl StringExt for String {
    fn clean_path(&self) -> String {
        self.clone()
    }
}

static mut COPY_CANCELLABLE: Option<Cancellable> = None; 
