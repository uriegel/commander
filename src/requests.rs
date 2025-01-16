use serde::Deserialize;
use webview_app::request::{get_input, request_blocking, Request};

use crate::{directory::{check_copy_items, copy_items, create_folder, delete_items, get_files, rename_as_copy, rename_item, rename_items}, 
    extended_items::{
        cancel_extended_items, get_extended_items
    }, remote::{check_copy_items_to_remote, delete_remote_files, get_remote_files}, request_error::{from_result, RequestError}, tracks::get_track_info, windows::directory::native_copy};
#[cfg(target_os = "linux")]
use crate::linux:: {root::get_root, directory::on_enter, headerbar::show_dialog};
#[cfg(target_os = "windows")]
use crate::windows::{root::get_root, progresses::cancel_copy, directory::on_enter, show_dialog};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowDialog {
    #[allow(dead_code)]
    pub show: bool
}

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
            "renameascopy" => from_result(rename_as_copy(get_input(&json))),
            "gettrackinfo" => from_result(get_track_info(get_input(&json))),
            "checkcopyitems" => from_result(check_copy_items(get_input(&json))),
            "checkcopyitemstoremote" => from_result(check_copy_items_to_remote(get_input(&json))),
            "copyitems" => from_result(copy_items(get_input(&json))),
            "renameitems" => from_result(rename_items(get_input(&json))),
            "getremotefiles" => from_result(get_remote_files(get_input(&json))),
            "deleteitemsremote" => from_result(delete_remote_files(get_input(&json))),
            "onenter" => from_result(on_enter(get_input(&json))),
            "showdialog" => from_result(show_dialog(get_input(&json))),
            #[cfg(target_os = "windows")]
            "cancelcopy" => from_result(cancel_copy()),
            #[cfg(target_os = "windows")]
            "nativecopy" => from_result(native_copy(get_input(&json))),
            _ => from_result(Ok::<(), RequestError>(()))
        }
    });
    true
}

