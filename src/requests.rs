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
            "getroot" => from_result(get_root()),
            "getfiles" => from_result(get_files(get_input(&json))),
            "getextendeditems" => from_result(get_extended_items(get_input(&json))),
            "cancelextendeditems" => from_result(cancel_extended_items(get_input(&json))),
            "gettrackinfo" => from_result(get_track_info(get_input(&json))),
            // TODO RequestError
            // Err(err) => {
            //     println!("Could not get track info: {}", err);
            //     get_output(&ItemsErrorResult {err: ErrorType { status: 3001, status_text: "Could not parse xml track".to_string() }})
            // }
            _ => from_result(Ok::<(), RequestError>(()))
        }
    });
    true
}

pub struct RequestError {
    status: ErrorType
}

// TODO RequestError
pub enum ErrorType {
    Unknown,
    AccessDenied,
    AlreadyExists,
    FileNotFound,
    DeleteToTrashNotPossible,
    NetNameNotFound,
    PathNotFound,
    NotSupported,
    PathTooLong,
    Canceled,
    WrongCredentials,
    NoDiskSpace,
    OperationInProgress,
    UacNotStarted = 1099
}

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorType {
    status: i32,
    status_text: String
}

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ItemsResult<T> {
    ok: T
}

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ItemsErrorResult {
    err: ErrorType
}

fn from_result<T, E>(result: Result<T, E>)->String 
where T: Serialize{
    match result {
        Ok(ok) => get_output(&ItemsResult { ok }),
        Err(err) => get_output(&ItemsErrorResult { err: ErrorType { status: 5, status_text: "".to_string() } }),
    }
}