use std::{ffi::c_void, fs::{metadata, Metadata}, os::windows::fs::MetadataExt, path::PathBuf};

use windows::{core::PCWSTR, Win32::Storage::FileSystem::{CopyFileExW, MoveFileWithProgressW, LPPROGRESS_ROUTINE_CALLBACK_REASON, MOVEFILE_COPY_ALLOWED, MOVEFILE_REPLACE_EXISTING}};

use crate::{directory::{get_extension, CopyItems}, error::Error, progresses::ProgressFiles, request_error::RequestError};

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

pub fn copy_items(input: CopyItems)->Result<(), RequestError> {
    let items: Vec<(&String, u64)> = input.items.iter().map(|item|
        (item, metadata(PathBuf::from(&input.path).join(&item))
            .ok()
            .map(|m| m.len())
            .unwrap_or_default()))
            .collect();
    
    let total_size = items.iter().fold(0u64, |curr, (_, i)|i + curr);
    let total_files = input.items.len() as u32;
    // TODO SendScript total_size, total_files

    items.iter().try_fold(ProgressFiles::default(), |curr, (file, file_size)| {
        let progress_files = curr.get_next(file, *file_size);
        // TODO progress_control.send_file(progress_files.file, progress_files.get_current_bytes(), progress_files.index);

        let source_file = PathBuf::from(&input.path).join(&file);
        let target_file = PathBuf::from(&input.target_path).join(&file);
        // TODO remove write protection on target
        if !input.move_ {
            let source_file = string_to_pcwstr(&source_file.to_string_lossy());
            let target_file = string_to_pcwstr(&target_file.to_string_lossy());
            unsafe { CopyFileExW(PCWSTR(source_file.as_ptr()), PCWSTR(target_file.as_ptr()), Some(progress_callback), None, None, 0)?; }
        } else {
            let source_file = string_to_pcwstr(&source_file.to_string_lossy());
            let target_file = string_to_pcwstr(&target_file.to_string_lossy());
            unsafe { MoveFileWithProgressW(PCWSTR(source_file.as_ptr()), PCWSTR(target_file.as_ptr()), None, None, 
                MOVEFILE_COPY_ALLOWED | MOVEFILE_REPLACE_EXISTING)?; }
        }
        // TODO Dropper for progress, show error
        Ok::<_, RequestError>(progress_files)
    })?;
    Ok(())
}

extern "system" fn progress_callback(
    _total_file_size: i64,
    _total_bytes_transferred: i64,
    _stream_size: i64,
    _stream_bytes_transferred: i64,
    _dw_stream_number: u32,
    _dw_callback_reason: LPPROGRESS_ROUTINE_CALLBACK_REASON,
    _h_source_file: windows::Win32::Foundation::HANDLE,
    _h_destination_file: windows::Win32::Foundation::HANDLE,
    _lp_data: *const c_void,
) -> u32 {
    // Insert your custom logic here
    println!("Progress callback triggered! {} {}", _total_bytes_transferred, _total_file_size);
    0
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
