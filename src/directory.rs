use std::{fs::{canonicalize, create_dir, read_dir, rename, File}, path::PathBuf, sync::{Mutex, MutexGuard, TryLockResult}, time::UNIX_EPOCH};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use urlencoding::decode;
use trash::delete_all;

use crate::{error::Error, request_error::RequestError};

#[cfg(target_os = "windows")]
use crate::windows::directory::{is_hidden, StringExt, get_icon_path};
#[cfg(target_os = "linux")]
use crate::linux::directory::{is_hidden, StringExt, get_icon_path, mount};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetFiles {
    //pub id: String,
    pub path: String,
    pub show_hidden_items: bool,
    #[cfg(target_os = "linux")]
    pub mount: bool
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFolder {
    pub path: String,
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteItems {
    pub path: String,
    pub names: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameItem {
    pub path: String,
    pub name: String,
    pub new_name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryItem {
    name: String,
    size: u64,
    is_directory: bool,
    icon_path: Option<String>,
    is_hidden: bool,
    time: Option<DateTime<Utc>>
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetFilesResult {
    items: Vec<DirectoryItem>,
    path: String,
    dir_count: usize,
    file_count: usize,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyItems {
    pub path: String,
    pub target_path: String,
    pub items: Vec<String>,
    pub move_: bool
}

pub fn get_files(input: GetFiles)->Result<GetFilesResult, RequestError> {
    let path = canonicalize(&input.path)
        .ok()
        .map(|p|p.to_string_lossy().to_string().clean_path())
        .unwrap_or_else(||input.path.clone());

    #[cfg(target_os = "linux")]
    let path = if input.mount { mount(&path) } else { path };
    
    let items: Vec<DirectoryItem> = read_dir(&path)
        ?.filter_map(|file|file.ok())
        .filter_map(|file| {
            if let Ok(metadata) = file.metadata() {
                Some((file, metadata))
            } else {
                None
            }
        })
        .map(|(entry, meta)| {
            let name = entry.file_name().to_str().unwrap_or_default().to_string();
            let is_directory = meta.is_dir();
            DirectoryItem {
                is_hidden: is_hidden(&name.as_str(), &meta),
                is_directory,
                size: meta.len(),
                time: meta.modified()
                            .ok()
                            .and_then(|t|t.duration_since(UNIX_EPOCH).ok())
                            .map(|d|DateTime::from_timestamp_nanos(d.as_nanos() as i64)), 
                icon_path: get_icon_path_of_file(&name, &path, is_directory).map(|s|s.to_string()),
                name
            }
        })
        .filter(|item| input.show_hidden_items || !item.is_hidden )
        .collect();
    let dir_count = items.iter().filter(|i|i.is_directory).count();

    Ok(GetFilesResult {
        path,
        dir_count,
        file_count: items.len() - dir_count, 
        items,
    })
}

pub fn get_extension(name: &str)->Option<&str> {
    match name.rfind('.') {
        Some(idx) if idx > 0 => {
            Some(&name[idx..])
        },
        _ => None
    }
}

pub fn get_file(path: &str)->Result<(String, File), Error> {
    let pos_end = path.find('?');
    let path = if let Some(pos_end) = pos_end { &path[..pos_end] } else { path };
    let path = decode(path)?.to_string();
    let file = File::open(&path)?;
    Ok((path, file))
}

pub fn create_folder(input: CreateFolder)->Result<(), RequestError> {
    let new_path = PathBuf::from(input.path).join(input.name);
    create_dir(new_path)?;
    Ok(())
}

pub fn delete_items(input: DeleteItems)->Result<(), RequestError> {
    delete_all(input.names.iter().map(|n|PathBuf::from(&input.path).join(n)))?;
    Ok(())
}

pub fn rename_item(input: RenameItem)->Result<(), RequestError> {
    let path = PathBuf::from(&input.path).join(input.name);
    let new_path = PathBuf::from(input.path).join(input.new_name);
    rename(path, new_path)?;
    Ok(())
}

pub fn try_copy_lock()->TryLockResult<MutexGuard<'static, bool>> {
    MUTEX.try_lock()
}

fn get_icon_path_of_file(name: &str, path: &str, is_directory: bool)->Option<String> {
    if !is_directory {
        get_icon_path(name, path)
    } else {
        None
    }
}

static MUTEX: Mutex<bool> = Mutex::new(false);