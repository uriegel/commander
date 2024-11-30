use serde::Serialize;
use webview_app::webview::WebView;

use crate::{cancellations::{self, CancellationType}, request_error::RequestError};

pub fn start_progress(total_files: u32, total_size: u64, mov: bool) {
    let _ = serde_json::to_string(
        &ProgressStart { 
            kind: "start",
            is_move: mov,
            total_files,
            total_size
        }
    ).inspect(|script| {
        let _ = WebView::execute_javascript(&format!("progresses({})", script)); 
    });
}

pub fn file_progress(current_name: String, _progress: f64, current_bytes: u64, current_files: u32) {
    let _ = serde_json::to_string(
        &ProgressFile { 
            kind: "file",
            file_name: &current_name,
            current_bytes,
            current_files
        }
    ).inspect(|script| {
        let _ = WebView::execute_javascript(&format!("progresses({})", script)); 
    });
}

pub fn bytes_progress(current_current: u64, current_total: u64, _total_current: u64, _total_total: u64, current_duration: i32, _estimated_duration: i32) {
    let _ = serde_json::to_string(
        &ProgressBytes { 
            kind: "bytes",
            current_bytes: current_current,
            total_bytes: current_total,
            total_seconds: current_duration
        }
    ).inspect(|script| {
        let _ = WebView::execute_javascript(&format!("progresses({})", script)); 
    });
}

pub fn end_progress() {
    let _ = serde_json::to_string(
        &ProgressFinished { 
            kind: "finished",
        }
    ).inspect(|script| {
        let _ = WebView::execute_javascript(&format!("progresses({})", script)); 
    });
}

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
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressFile<'a> {
    pub kind: &'a str,
    pub file_name: &'a str,
    pub current_files: u32,
    pub current_bytes: u64
}

pub fn cancel_copy()->Result<(), RequestError> {
    let _ = cancellations::cancel(None, CancellationType::Copy);
    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressBytes<'a> {
    kind: &'a str,
    current_bytes: u64,
    total_bytes: u64,
    total_seconds: i32
}

