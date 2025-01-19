#![allow(deprecated)]
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex, OnceLock};
use async_channel::Sender;

use gtk::gio::{self, content_type_guess};
use gtk::{prelude::*, AppChooserWidget};
use gtk::{glib, AppChooserDialog, Window};

pub fn init_open_with(parent_window: Window) {
    let (sender, receiver) = async_channel::unbounded();
    OPENWITH_SENDER.set(Arc::new(Mutex::new(sender))).unwrap();
    glib::spawn_future_local(async move {
        while let Ok(file) = receiver.recv().await {
            let info = get_content_type(&file).unwrap_or("application/octet-stream".to_string());
            let dialog = AppChooserDialog::for_content_type(
                Some(&parent_window),
                gtk::DialogFlags::MODAL,
                &info);
            if let Ok(widget) = dialog.widget().downcast::<AppChooserWidget>() {
                widget.set_show_default(true);
                widget.set_show_recommended(true);
            }
        
            dialog.connect_response(move|dialog, response| {
                if response == gtk::ResponseType::Ok {
                    if let Some(app_info) = dialog.app_info() {
                        let _ = app_info.launch_uris(&[&file], None::<&gio::AppLaunchContext>);
                    }
                }
                dialog.close();
            });
            dialog.show();
        }
    });   
}

pub fn open_with(file: String) {
    let _ = OPENWITH_SENDER.get().unwrap().lock().unwrap().send_blocking(file);
}

fn get_content_type(file_path: &str) -> Option<String> {
    let path = Path::new(file_path);
    if let Ok(file_data) = fs::read(path) {
        // Guess the content type based on file data and file name
        let (mime_type, _) = content_type_guess(Some(file_path), &file_data);
        return Some(mime_type.to_string());
    }
    None
}

static OPENWITH_SENDER: OnceLock<Arc<Mutex<Sender<String>>>> = OnceLock::new();