use serde::Serialize;
use webview_app::request::{get_input, get_output, request_blocking, Request};

use crate::directory::get_files;
#[cfg(target_os = "linux")]
use crate::linux::root::get_root;
#[cfg(target_os = "windows")]
use crate::windows::root::get_root;

pub fn on_request(request: &Request, id: String, cmd: String, json: String)->bool {
    request_blocking(request, id, move || {
        match cmd.as_str() {
            "getroot" => get_output(&get_root()),
            "getfiles" => get_output(&get_files(get_input(&json))),
            _ => get_output(&Empty {})
        }
    });
    true
}

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemsResult<T> {
    pub ok: T
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Empty {}

