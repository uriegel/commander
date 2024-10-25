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

// TODO Windows version info
/*
 let schrott = string_to_pcwstr(&"c:\\windows\\explorer.exe");
    let size = unsafe { GetFileVersionInfoSizeW(PCWSTR(schrott.as_ptr()), None) };
    let mut buffer = vec![0u8; size as usize];
    let res = unsafe { GetFileVersionInfoW(PCWSTR(schrott.as_ptr()), 0, size, buffer.as_mut_ptr() as *mut c_void) };
    res.unwrap();
//    let mut versch = VS_FIXEDFILEINFO::default();
//    let mut value_ptr: *mut c_void = &mut versch as *mut _ as *mut c_void;
    let mut size:u32 = 0;

    let mut value_ptr: *mut c_void = ptr::null_mut();


    let aschabe = string_to_pcwstr(&"\\");
    let success = unsafe { VerQueryValueW(buffer.as_ptr() as *mut c_void, PCWSTR(aschabe.as_ptr()), &mut value_ptr, &mut size) };

        
    if success.as_bool() && !value_ptr.is_null() {

        let versch = unsafe { &*(value_ptr as *const VS_FIXEDFILEINFO) };

        // Now `versch` contains the fixed file version information
        println!("File version: {}.{}.{}.{}",
            (versch.dwFileVersionMS >> 16) & 0xffff,
            versch.dwFileVersionMS & 0xffff,
            (versch.dwFileVersionLS >> 16) & 0xffff,
            versch.dwFileVersionLS & 0xffff);
    } else {
        eprintln!("Failed to query fixed file info.");
    }
*/


// TODO viewer
// TODO viewer gps info

// TODO Windows 10: WM_NCCALC
// TODO Windows icons best with ver 9.0.0, but crash on windows 125%, test with labtop. some exe icons are invisible with 16px

// TODO /boot/loader/entries  => panic: access denied
// TODO no // on linux status bar in root

// TODO Windows Ico and Window icon
// TODO fs_extra::copy_items_with_progress
// TODO Trash: https://docs.rs/trash/latest/trash/
