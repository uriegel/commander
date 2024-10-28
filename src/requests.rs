use serde::Serialize;
use webview_app::request::{get_input, get_output, request_blocking, Request};

use crate::{directory::get_files, extended_items::{cancel_extended_items, get_extended_items}, tracks::get_track_info};
#[cfg(target_os = "linux")]
use crate::linux::root::get_root;
#[cfg(target_os = "windows")]
use crate::windows::root::get_root;

pub fn on_request(request: &Request, id: String, cmd: String, json: String)->bool {
    request_blocking(request, id, move || {
        match cmd.as_str() {
            "getroot" => get_output(&get_root()),
            "getfiles" => get_output(&get_files(get_input(&json))),
            "getextendeditems" => get_output(&get_extended_items(get_input(&json))),
            "cancelextendeditems" => get_output(&cancel_extended_items(get_input(&json))),
            "gettrackinfo" => match get_track_info(get_input(&json)) {
                Ok(ok) => get_output(&ItemsResult {ok}),
                Err(err) => {
                    println!("Could not get track info: {}", err);
                    get_output(&ItemsErrorResult {err: ErrorType { status: 3001, status_text: "Could not parse xml track".to_string() }})
                }
            },
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

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ItemsErrorResult {
    pub err: ErrorType
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Empty {}

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorType {
    status: i32,
    status_text: String
}