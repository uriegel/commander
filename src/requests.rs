use std::sync::mpsc::{channel, Sender};

use serde::Serialize;
use webview_app::request::{get_input, get_output, request_blocking, Request};

use crate::{cancellations::get_cancellation, directory::get_files, extended_items::{cancel_extended_items, get_extended_items}};
#[cfg(target_os = "linux")]
use crate::linux::root::get_root;
#[cfg(target_os = "windows")]
use crate::windows::root::get_root;

pub fn on_request(request: &Request, id: String, cmd: String, json: String)->bool {
    request_blocking(request, id, move || {
        match cmd.as_str() {
            "getroot" => get_output(&get_root()),
            "getfiles" => get_output(&get_files(get_input(&json))),
            "getextendeditems" => {
                let input = get_input(&json);
                let (snd, rcv) = channel::<bool>();
                change_cancellation(snd);             
                get_output(&get_extended_items(input, rcv))
            },
            "cancelextendeditems" => get_output(&cancel_extended_items(get_input(&json))),
            _ => get_output(&Empty {})
        }
    });
    true
}

fn change_cancellation(sender: Sender<bool>) {
    let mut snd = get_cancellation().lock().unwrap();
    snd.as_ref().inspect(|s|{ let _ = s.send(true);});
    *snd = Some(sender);
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

