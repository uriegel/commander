use std::{fs::Metadata, os::windows::fs::MetadataExt, path::PathBuf, time::UNIX_EPOCH};

use chrono::{DateTime, Utc};
use serde::Serialize;

use crate::{directory::{get_extension, DirectoryItem}, error::Error};

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

// fn copy(input: &CopyItems, items: Vec<(&String, u64)>, cpy: *const c_void)->Result<(), RequestError> {
//     items.iter().try_fold(ProgressFiles::default(), |curr, (file, file_size)| {
//         let progress_files = curr.get_next(file, *file_size);
//         let source_file = PathBuf::from(&input.path).join(&file);
//         let target_file = PathBuf::from(&input.target_path).join(&file);
//         let ps = ProgressFile {
//             kind: "file",
//             file_name: file,
//             current_bytes: progress_files.get_current_bytes(),
//             current_file: progress_files.index
//         };
//         WebView::execute_javascript(&format!("progresses({})", serde_json::to_string(&ps)?)); 
//         let res = copy_item(source_file, target_file, input.job_type == JobType::Move, cpy);
//         res?;
//         Ok::<_, RequestError>(progress_files)
//     })?;
//     Ok(())
// }

// fn copy_item(source_file: PathBuf, target_file: PathBuf, move_: bool, cpy: *const c_void)->Result<(), RequestError> {
//     if !move_ {
//         let source_file = string_to_pcwstr(&source_file.to_string_lossy());
//         let target_file = string_to_pcwstr(&target_file.to_string_lossy());
//         // TODO remove write protection on target
//         unsafe { CopyFileExW(PCWSTR(source_file.as_ptr()), PCWSTR(target_file.as_ptr()), 
//             Some(progress_callback), Some(cpy), None, 0)?; }
//     } else {
//         // TODO remove write protection on target and on source, set write protection on target OR FLAGS
//         let source_file = string_to_pcwstr(&source_file.to_string_lossy());
//         let target_file = string_to_pcwstr(&target_file.to_string_lossy());
//         unsafe { MoveFileWithProgressW(PCWSTR(source_file.as_ptr()), PCWSTR(target_file.as_ptr()), 
//             Some(progress_callback), Some(cpy), 
//             MOVEFILE_COPY_ALLOWED | MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)?; }
//     }    
//     Ok(())
// }

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
