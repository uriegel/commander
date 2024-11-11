use std::{ffi::c_void, fs::{metadata, Metadata}, os::windows::fs::MetadataExt, path::PathBuf};

use chrono::Local;
use webview_app::webview::WebView;
use windows::{core::PCWSTR, Win32::Storage::FileSystem::{CopyFileExW, MoveFileWithProgressW, 
    MOVEFILE_COPY_ALLOWED, MOVEFILE_REPLACE_EXISTING, MOVEFILE_WRITE_THROUGH}
};

use crate::{directory::{get_extension, try_copy_lock, CopyItems}, error::Error, progresses::ProgressFiles, request_error::RequestError};

use super::{progresses::{progress_callback, reset_progress_cancel, CopyData, ProgressFile, ProgressFinished, ProgressStart}, string_to_pcwstr};

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

pub fn copy_items(input: CopyItems)->Result<(), RequestError> {

    let _binding = try_copy_lock()?;
    reset_progress_cancel();

    let items: Vec<(&String, u64)> = input.items.iter().map(|item|
        (item, metadata(PathBuf::from(&input.path).join(&item))
            .ok()
            .map(|m| m.len())
            .unwrap_or_default()))
            .collect();
    
    let total_size = items.iter().fold(0u64, |curr, (_, i)|i + curr);
    let total_files = input.items.len() as u32;
    let ps = ProgressStart {
        kind: "start",
        is_move: input.move_,
        total_files,
        total_size
    };
    WebView::execute_javascript(&format!("progresses({})", serde_json::to_string(&ps)?)); 
    let copy_data = CopyData::new();
    let start_time = copy_data.start_time;
    let cpy = Box::into_raw(Box::new(copy_data)) as *const c_void;
    let res = copy(&input, items, cpy);
    unsafe { let _ = Box::from_raw(cpy as *mut CopyData); }
    WebView::execute_javascript(&format!("progresses({})", serde_json::to_string(&ProgressFinished { 
        kind: "finished",
        total_seconds: (Local::now() - start_time).num_seconds() as i32
    })?)); 
    res
}

fn copy(input: &CopyItems, items: Vec<(&String, u64)>, cpy: *const c_void)->Result<(), RequestError> {
    items.iter().try_fold(ProgressFiles::default(), |curr, (file, file_size)| {
        let progress_files = curr.get_next(file, *file_size);
        let source_file = PathBuf::from(&input.path).join(&file);
        let target_file = PathBuf::from(&input.target_path).join(&file);
        let ps = ProgressFile {
            kind: "file",
            file_name: file,
            current_bytes: progress_files.get_current_bytes(),
            current_file: progress_files.index
        };
        WebView::execute_javascript(&format!("progresses({})", serde_json::to_string(&ps)?)); 
        let res = copy_item(source_file, target_file, input.move_, cpy);
        res?;
        Ok::<_, RequestError>(progress_files)
    })?;
    Ok(())
}

fn copy_item(source_file: PathBuf, target_file: PathBuf, move_: bool, cpy: *const c_void)->Result<(), RequestError> {
    if !move_ {
        let source_file = string_to_pcwstr(&source_file.to_string_lossy());
        let target_file = string_to_pcwstr(&target_file.to_string_lossy());
        // TODO remove write protection on target
        unsafe { CopyFileExW(PCWSTR(source_file.as_ptr()), PCWSTR(target_file.as_ptr()), 
            Some(progress_callback), Some(cpy), None, 0)?; }
    } else {
        // TODO remove write protection on target and on source, set write protection on target OR FLAGS
        let source_file = string_to_pcwstr(&source_file.to_string_lossy());
        let target_file = string_to_pcwstr(&target_file.to_string_lossy());
        unsafe { MoveFileWithProgressW(PCWSTR(source_file.as_ptr()), PCWSTR(target_file.as_ptr()), 
            Some(progress_callback), Some(cpy), 
            MOVEFILE_COPY_ALLOWED | MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)?; }
    }    
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
