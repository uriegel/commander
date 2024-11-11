use webview_app::request::{get_input, request_blocking, Request};

use crate::{directory::{create_folder, delete_items, get_files, rename_item}, extended_items::{
    cancel_extended_items, get_extended_items
}, request_error::{from_result, RequestError}, tracks::get_track_info};
#[cfg(target_os = "linux")]
use crate::linux::{root::get_root, directory::copy_items};
#[cfg(target_os = "windows")]
use crate::windows::{root::get_root, directory::copy_items, progresses::cancel_copy};

pub fn on_request(request: &Request, id: String, cmd: String, json: String)->bool {
    request_blocking(request, id, move || {
        match cmd.as_str() {
            "getroot" => from_result(get_root()),
            "getfiles" => from_result(get_files(get_input(&json))),
            "getextendeditems" => from_result(get_extended_items(get_input(&json))),
            "cancelextendeditems" => from_result(cancel_extended_items(get_input(&json))),
            "createfolder" => from_result(create_folder(get_input(&json))),
            "deleteitems" => from_result(delete_items(get_input(&json))),
            "renameitem" => from_result(rename_item(get_input(&json))),
            "gettrackinfo" => from_result(get_track_info(get_input(&json))),
            "copyitems" => from_result(copy_items(get_input(&json))),
            #[cfg(target_os = "windows")]
            "cancelCopy" => from_result(cancel_copy()),
            _ => from_result(Ok::<(), RequestError>(()))
        }
    });
    true
}

