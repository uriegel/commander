use serde::Serialize;
use webview_app::request::{get_output, request_blocking, Request};

use crate::linux::root::get_root;

pub fn on_request(request: &Request, id: String, cmd: String, _json: String)->bool {
    request_blocking(request, id, move || {
        match cmd.as_str() {
            "getroot" => get_output(&get_root()),
            _ => get_output(&Empty {})
        }
    });
    true
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Empty {}

