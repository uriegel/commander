use std::{fs::{canonicalize, read_dir}, time::UNIX_EPOCH};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::requests::ItemsResult;

#[cfg(target_os = "windows")]
use crate::windows::directory::{is_hidden, StringExt};
#[cfg(target_os = "linux")]
use crate::linux::directory::{is_hidden, StringExt};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetFiles {
    pub id: String,
    pub path: String,
    pub show_hidden_items: bool,
    pub mount: bool
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

pub fn get_files(input: GetFiles)->ItemsResult<GetFilesResult> {
    let items: Vec<DirectoryItem> = read_dir(&input.path)
        .unwrap()
        .filter_map(|file|file.ok())
        .filter_map(|file| {
            if let Ok(metadata) = file.metadata() {
                Some((file, metadata))
            } else {
                None
            }
        })
        .map(|(entry, meta)| {
            let name = entry.file_name().to_str().unwrap().to_string();
            let is_directory = meta.is_dir();
            DirectoryItem {
                is_hidden: is_hidden(&name.as_str(), &meta),
                is_directory,
                size: meta.len(),
                time: meta.modified()
                            .ok()
                            .and_then(|t|t.duration_since(UNIX_EPOCH).ok())
                            .map(|d|DateTime::from_timestamp_nanos(d.as_nanos() as i64)), 
                icon_path: get_icon_path_of_file(&name, is_directory).map(|s|s.to_string()),
                name
            }
        })
        .filter(|item| input.show_hidden_items || !item.is_hidden )
        .collect();
    let dir_count = items.iter().filter(|i|i.is_directory).count();
    ItemsResult {
        ok: GetFilesResult {
            path: canonicalize(&input.path)
                    .ok()
                    .map(|p|p.to_string_lossy().to_string().clean_path())
                    .unwrap_or(input.path),
            dir_count,
            file_count: items.len() - dir_count, 
            items,
        }
    }
    
}

fn get_extension(name: &str)->Option<&str> {
    match name.rfind('.') {
        Some(idx) if idx > 0 => {
            Some(&name[idx..])
        },
        _ => None
    }
}

fn get_icon_path(name: &str)->Option<&str> {
    get_extension(name)
}

fn get_icon_path_of_file(name: &str, is_directory: bool)->Option<&str> {
    if !is_directory {
        get_icon_path(name)
    } else {
        None
    }
}