use std::{fs::Metadata, os::windows::fs::MetadataExt, path::PathBuf};

use windows::{core::PCWSTR, Win32::Storage::FileSystem::{CopyFileExW, MoveFileWithProgressW, MOVEFILE_COPY_ALLOWED, MOVEFILE_REPLACE_EXISTING}};

use crate::{directory::get_extension, error::Error, request_error::RequestError};

use super::string_to_pcwstr;

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

pub fn copy_item<F>(source: &PathBuf, target: &PathBuf, mut cb: F)->Result<(), RequestError> 
where F: FnMut(i64, i64) {
    let source_file = string_to_pcwstr(&source.to_string_lossy());
    // TODO remove write protection on target
    let target_file = string_to_pcwstr(&target.to_string_lossy());
    unsafe { CopyFileExW(PCWSTR(source_file.as_ptr()), PCWSTR(target_file.as_ptr()), None, None, None, 0)?; }
    Ok(())
}

pub fn move_item<F>(source: &PathBuf, target: &PathBuf, mut cb: F)->Result<(), RequestError> 
where F: FnMut(i64, i64) {
    let source_file = string_to_pcwstr(&source.to_string_lossy());
    // TODO remove write protection on target
    let target_file = string_to_pcwstr(&target.to_string_lossy());
    unsafe { MoveFileWithProgressW(PCWSTR(source_file.as_ptr()), PCWSTR(target_file.as_ptr()), None, None, 
        MOVEFILE_COPY_ALLOWED | MOVEFILE_REPLACE_EXISTING)?; } // TODO Dropper for progress
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
