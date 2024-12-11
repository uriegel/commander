use std::{fs::{File, Metadata}, mem, os::windows::fs::MetadataExt, path::PathBuf, time::UNIX_EPOCH};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use windows::{
    core::PCWSTR, Win32::{
        Storage::FileSystem::{
            MoveFileWithProgressW, MOVEFILE_REPLACE_EXISTING, MOVEFILE_WRITE_THROUGH
        }, UI::Shell::{
            SHFileOperationW, ShellExecuteExW, FO_COPY, FO_MOVE, SEE_MASK_INVOKEIDLIST, SHELLEXECUTEINFOW, SHFILEOPSTRUCTW
        }
    }
};

use crate::{directory::{get_extension, DirectoryItem}, error::Error, extended_items::Version, request_error::RequestError};
use super::{string_to_pcwstr, version::get_version};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictItem {
	name: String,
	icon_path: Option<String>,
    size: u64,
    time: Option<DateTime<Utc>>,
    version: Option<Version>,
    target_size: u64,
    target_time: Option<DateTime<Utc>>,
    target_version: Option<Version>
}

impl ConflictItem {
    pub fn from(path: &str, target_path: &str, item: &DirectoryItem, metadata: &Metadata)->Self {
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
            target_time,
            version: get_version(path, &item.name),
            target_version: get_version(target_path, &item.name),
        }
    }

    pub fn from_values(item: &DirectoryItem, size: u64, time: i64)->Self {
        let target_size = size;
        let target_time = Some(DateTime::from_timestamp_nanos(time * 1_000_000)); 
        Self {
            name: item.name.clone(),
            icon_path: item.icon_path.clone(),
            size: item.size,
            time: item.time,
            version: None,
            target_version: None, 
            target_size,
            target_time
        }
    }

}

pub fn is_hidden(_: &str, metadata: &Metadata)->bool {
    let attrs = metadata.file_attributes();
    attrs & 2 == 2
}

pub fn get_icon_path(name: &str, path: &str)->Option<String> {
    match get_extension(name) {
        Some(ext) if ext.to_lowercase() == ".exe" => 
            Some(PathBuf::from(path).join(name).to_string_lossy().to_string()),
        Some(ext) => Some(ext.to_string()),
        None => None
    }
}

pub fn get_icon(path: &str)->Result<(String, Vec<u8>), Error> {
    let icon = systemicons::get_icon(&path.replace("%20", " "), 16)?;
    Ok(("icon.png".to_string(), icon))
}

pub fn update_directory_item(item: DirectoryItem, metadata: &Metadata)->DirectoryItem {
    let size = metadata.len();
    let time =  metadata.modified()
                .ok()
                .and_then(|t|t.duration_since(UNIX_EPOCH).ok())
                .map(|d|DateTime::from_timestamp_nanos(d.as_nanos() as i64)); 
    DirectoryItem { size, time, ..item }
}

pub fn move_item(source_file: &PathBuf, target_file: &PathBuf)->Result<(), RequestError> {
    let source_file = string_to_pcwstr(&source_file.to_string_lossy());
    let target_file = string_to_pcwstr(&target_file.to_string_lossy());
    unsafe { MoveFileWithProgressW(PCWSTR(source_file.as_ptr()), PCWSTR(target_file.as_ptr()), 
        None, None, MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)?; 
    }
    Ok(())
}

pub fn copy_attributes(source_file: &File, target_file: &File)->Result<(), RequestError> {
    let meta = source_file.metadata()?;
    let modified = meta.modified()?;
    target_file.set_modified(modified)?;
    target_file.set_permissions(meta.permissions())?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecialKeys {
    alt: bool,
    ctrl: bool,
    shift: bool,
}


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OnEnter {
    path: String,
    keys: Option<SpecialKeys>
}

pub fn on_enter(input: OnEnter)->Result<(), RequestError> {
    let file = string_to_pcwstr(&input.path);

    let verb = string_to_pcwstr(match input.keys {
        Some(SpecialKeys { alt: true, .. }) => "properties",
        Some(SpecialKeys  { ctrl: true, .. }) => "openas",
        _ => "open"
    });

    let mut info = SHELLEXECUTEINFOW {
        cbSize: mem::size_of::<SHELLEXECUTEINFOW>() as u32,
        fMask: SEE_MASK_INVOKEIDLIST,
        lpFile: PCWSTR(file.as_ptr()),
        lpVerb: PCWSTR(verb.as_ptr()),
        ..Default::default()
    };

    unsafe { ShellExecuteExW(&mut info) }?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeCopy {
    id: String,
    files: Vec<String>, 
    target: String,
    #[serde(rename = "move")]
    mov: bool
}

pub fn native_copy(input: NativeCopy) -> Result<(), RequestError> {
    let mut input_buffer = 
        input
            .files
            .iter()
            .map(|f|string_to_pcwstr(f))
            .collect::<Vec<_>>()
            .concat();
    input_buffer.push(0);
    let mut target_buffer = string_to_pcwstr(&input.target);
    target_buffer.push(0);
     
    let mut sh_file_op = SHFILEOPSTRUCTW {
        wFunc: if input.mov { FO_MOVE } else { FO_COPY },
        pFrom: PCWSTR(input_buffer.as_mut_ptr()),
        pTo: PCWSTR(target_buffer.as_mut_ptr()),
        ..Default::default()
    };
    let res = unsafe { SHFileOperationW(&mut sh_file_op) };
    // TODO resssss to RequestError
    // TODO After copy_native refresh view
    println!("Ressss {res}");
    Ok(()) 
}

pub trait StringExt {
    fn clean_path(&self) -> String;
}

impl StringExt for String {
    fn clean_path(&self) -> String {
        if self.starts_with("\\\\?\\") {
            self[4..].to_string()
        } else {
            self.clone()
        }
    }
}
