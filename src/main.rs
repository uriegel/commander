#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// Allows console to show up in debug build but not release build.

pub static APP_ID: &str = "de.uriegel.commander";

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "windows")]
mod windows;
mod httpserver;
mod requests;
mod directory;
mod error;
mod extended_items;
mod cancellations;

#[cfg(target_os = "windows")]
use std::sync::{Arc, Mutex};

use requests::on_request;
use include_dir::include_dir;

use webview_app::{application::Application, webview::WebView};

#[cfg(target_os = "linux")]
use linux::headerbar::HeaderBar;

pub const HTTP_PORT: u32 = 8000;

fn on_activate(app: &Application)->WebView {
    let dir = include_dir!("website/dist");
    #[cfg(target_os = "windows")]
    let arc_dir = Some(Arc::new(Mutex::new(dir.clone())));

    let webview_builder = WebView::builder(app)
        .save_bounds()
        .title("Commander".to_string())
        .devtools(true)
        .debug_url("http://localhost:5173/?port=8000".to_string()) // TODO 
        .webroot(dir.clone())
        .url(format!("http://localhost:{HTTP_PORT}/webroot/index.html"))
        .default_contextmenu_disabled()
        .without_native_titlebar();

    #[cfg(target_os = "linux")]    
    let webview_builder = webview_builder
        .with_builder("/de/uriegel/commander/window.ui".to_string(), move|builder| HeaderBar::new(builder));

    #[cfg(target_os = "windows")]
    let webroot = arc_dir;
    #[cfg(target_os = "linux")]
    let webroot = None;

    httpserver::httpserver::HttpServerBuilder::new()
        .port(HTTP_PORT)
        .build()
        .run(webroot);

    let webview = webview_builder.build();
    
    webview.connect_request(on_request);
    webview
}

fn main() {
    #[cfg(target_os = "linux")]        
    gtk::gio::resources_register_include!("commander.gresource")
        .expect("Failed to register resources.");

    Application::new(APP_ID)
    .on_activate(on_activate)
    .run();
}

// TODO cancellation: replace option with hashmap with key: struct id, enum type
// TODO Windows version
// TODO viewer
// TODO viewer gps info

// TODO /boot/loader/entries  => panic: access denied
// TODO no // on linux status bar in root

// TODO Windows Ico and Window icon
// TODO fs_extra::copy_items_with_progress
// TODO Trash: https://docs.rs/trash/latest/trash/
