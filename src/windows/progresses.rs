use std::{ffi::c_void, time::Duration};

use chrono::{DateTime, Local};
use serde::Serialize;
use webview_app::webview::WebView;
use windows::Win32::Storage::FileSystem::LPPROGRESS_ROUTINE_CALLBACK_REASON;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressStart<'a> {
    pub kind: &'a str,
    pub is_move: bool, 
    pub total_files: u32,
    pub total_size: u64
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressFinished<'a> {
    pub kind: &'a str,
    pub total_seconds: i32
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressFile<'a> {
    pub kind: &'a str,
    pub file_name: &'a str,
    pub current_file: u32,
    pub current_bytes: u64
}

pub struct CopyData {
    pub start_time: DateTime<Local>,
    pub last_time: Option<DateTime<Local>>
}

impl CopyData {
    pub fn new()->Self {
        Self {
            start_time: Local::now(),
            last_time: Some(Local::now())
        }
    }
} 

pub extern "system" fn progress_callback(
    total_file_size: i64,
    total_bytes_transferred: i64,
    _stream_size: i64,
    _stream_bytes_transferred: i64,
    _dw_stream_number: u32,
    _dw_callback_reason: LPPROGRESS_ROUTINE_CALLBACK_REASON,
    _h_source_file: windows::Win32::Foundation::HANDLE,
    _h_destination_file: windows::Win32::Foundation::HANDLE,
    lp_data: *const c_void,
) -> u32 {
    let copy_data: &mut CopyData = unsafe { &mut *(lp_data as *mut CopyData) };
    let now = Local::now();
    if now > copy_data.last_time.unwrap_or_default() + FRAME_DURATION {

        let _ = serde_json::to_string(
            &ProgressBytes { 
                kind: "bytes", 
                current_bytes: total_bytes_transferred,
                total_bytes: total_file_size,
                total_seconds: (now - copy_data.start_time).num_seconds() as i32
            }
        ).inspect(|script| {
            let _ = WebView::execute_javascript(&format!("progresses({})", script)); 
        });
        
        copy_data.last_time.replace(now);
    }
    0
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressBytes<'a> {
    kind: &'a str,
    current_bytes: i64,
    total_bytes: i64,
    total_seconds: i32
}

const FRAME_DURATION: Duration = Duration::from_millis(40);