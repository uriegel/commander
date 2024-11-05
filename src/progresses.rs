use std::sync::{Arc, Mutex};

use async_channel::Sender;

// TODO debounce 40ms before sending via channel (or via SendJavscript in Windows)
enum Progresses {
    Files(FilesProgress),
    File(FileProgress),
}

#[derive(Default)]
struct FilesProgress {
    current_size: i64,
    total_size: i64,
    current_name: String,
    total_files: i32,
    current_files: i32
}

#[derive(Default)]
struct FileProgress {
    current: Progress,
    total: Progress,
}

#[derive(Default)]
struct Progress {
    current: u64,
    total: u64    
}

fn set_progress_sender(snd: Sender<Progresses>) {
    unsafe { PROGRESS_SENDER = Some(Arc::new(Mutex::new(snd))) };
}

fn get_sender()->&'static Arc<Mutex<Sender<Progresses>>> {
    unsafe {
        PROGRESS_SENDER.as_ref().unwrap()        
    }
}

static mut PROGRESS_SENDER: Option<Arc<Mutex<Sender<Progresses>>>> = None;