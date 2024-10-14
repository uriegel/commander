#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// Allows console to show up in debug build but not release build.

#[cfg(target_os = "linux")]
mod linux;

use std::{thread, time::Duration};

use serde::{Deserialize, Serialize};

use webview_app::{application::Application, request::{self, request_blocking, Request}, webview::WebView};

#[cfg(target_os = "linux")]
use linux::headerbar::HeaderBar;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub text: String,
    pub id: i32
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Output {
    pub text: String,
    pub email: String,
    pub number: i32
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Outputs {
    pub outputs: Vec<Output>
}

fn on_activate(app: &Application)->WebView {
    let webview_builder = WebView::builder(app)
        .save_bounds()
        .title("Commander".to_string())
        .devtools(true)
        .debug_url("http://localhost:5173/".to_string())
        .default_contextmenu_disabled()
        .without_native_titlebar();

    #[cfg(target_os = "linux")]    
    let webview_builder = webview_builder
        .with_builder("/de/uriegel/commander/window.ui".to_string(), |builder| HeaderBar::new(builder));

    let webview = webview_builder.build();
    
    webview.connect_request(|request, id, cmd: String, json| {
        match cmd.as_str() {
            "cmd1" => cmd1(request, id, json),
            "cmd2" => cmd2(request, id),
            _ => {}
        }
        true
    });
    webview
}

fn main() {

    #[cfg(target_os = "linux")]        
    gtk::gio::resources_register_include!("commander.gresource")
        .expect("Failed to register resources.");

    Application::new("de.uriegel.commander")
    .on_activate(on_activate)
    .run();
}

fn cmd1(request: &Request, id: String, json: String) {
    request_blocking(request, id, move || {
        let input: Input = request::get_input(&json);
        let res = Output {
            email: "uriegel@hotmail.de".to_string(),
            text: input.text,
            number: input.id + 1,
        };
        request::get_output(&res)
    })
}

fn cmd2(request: &Request, id: String) {
    request_blocking(request, id, move || {
        let five_seconds = Duration::from_secs(5);
        thread::sleep(five_seconds);

        let res = Output {
            email: "uriegel@hotmail.de".to_string(),
            text: "Return fom cmd2  sd fd fdsf dsfdsg fdg dfg dfgdfgfdgdfgdfgdffdg dfg dfg dfgdfg dfg dfgdfg dfg dfg".to_string(),
            number: 222,
        };
        request::get_output(&res)
    })
}

// TODO Linux Titlebar
// TODO Windows Beenden form menu minimizes the window
// TODO Release  version via res scheme
// TODO README describe npm init in sub folder webroot
// TODO README describe debugging
