use std::sync::{Arc, Mutex, OnceLock};

use async_channel::Sender;
use gtk::prelude::*;
use gtk::{glib::{self, clone}, Builder};

pub fn initialize(builder: &Builder) {
    let webview: webkit6::WebView = builder.object("webview").unwrap();
    let (snd, receiver) = async_channel::unbounded::<bool>();
    SEND_FOCUS.set(Arc::new(Mutex::new(snd))).unwrap();

    glib::spawn_future_local(clone!(
        #[weak]
        webview,
        async move {
            while let Ok(_) = receiver.recv().await {
                webview.grab_focus(); 
            }   
        }));
}

pub fn get_sender()->&'static Arc<Mutex<Sender<bool>>> {
    SEND_FOCUS.get().unwrap()        
}

static SEND_FOCUS: OnceLock<Arc<Mutex<Sender<bool>>>> = OnceLock::new();