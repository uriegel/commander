use std::sync::{Arc, Mutex, OnceLock};

use async_channel::Sender;

use super::progress_display::ProgressDisplay;

pub fn set_progress_sender(snd: Sender<Progresses>) {
    PROGRESS_SENDER.set(Arc::new(Mutex::new(snd))).unwrap()
}

pub fn start_progress(total_files: u32, total_size: u64, mov: bool) {
    let sender = get_sender().lock().unwrap();
    let _ = sender.send_blocking(Progresses::Start(FilesProgressStart {total_files, total_size, mov }));
}

pub fn file_progress(current_name: String, progress: f64, _total_bytes: u64, current_files: u32) {
    let sender = get_sender().lock().unwrap();
    let _ = sender.send_blocking(Progresses::Files(FilesProgress {
        current_name, 
        progress, 
        current_files
    }));
}

pub fn bytes_progress(current_current: u64, current_total: u64, total_current: u64, total_total: u64, current_duration: i32, estimated_duration: i32) {
    let sender = get_sender().lock().unwrap();
    let current = current_current as f64 / current_total as f64;
    let current = if current < 0.0 || current > 1.0 || current_total == 0 { 0.0 } else { current };
    let total = total_current as f64 / total_total as f64;
    let total = if total > 0.0 { total } else { 1.0 };
    let _ = sender.send_blocking(Progresses::File(FileProgress {
        current_duration,
        current,
        total,
        estimated_duration
    }));
}

pub fn end_progress() {
    let sender = get_sender().lock().unwrap();
    let _ = sender.send_blocking(Progresses::End);
}

pub enum Progresses {
    Start(FilesProgressStart),
    Files(FilesProgress),
    File(FileProgress),
    End
}

#[derive(Default)]
pub struct FilesProgressStart {
    pub total_size: u64,
    pub total_files: u32,
    pub mov: bool
}

#[derive(Default)]
pub struct FilesProgress {
    pub progress: f64,
    pub current_name: String,
    pub current_files: u32
}

#[derive(Default)]
pub struct FileProgress {
    pub current: f64,
    pub total: f64,
    pub current_duration: i32,
    pub estimated_duration: i32
}

fn get_sender()->&'static Arc<Mutex<Sender<Progresses>>> {
    PROGRESS_SENDER.get().unwrap()        
}

impl Progresses {
    pub fn display_progress(&self, display: &ProgressDisplay) {
        match self {
            Progresses::Start(start) => {
                display.set_total_count(start.total_files as i32);        
                display.set_current_count(0);        
                display.set_current_name("");
                display.set_size(start.total_size);
                display.set_total_progress(0.0);
                display.set_current_progress(0.0);
                display.set_duration(0);
                display.set_estimated_duration(0);
                display.set_mov(start.mov);
            } 
            Progresses::Files(files) => {
                display.set_current_count(files.current_files as i32);        
                display.set_current_name(files.current_name.clone());
                display.set_total_progress(files.progress);
            } 
            Progresses::File(file) => {
                display.set_total_progress(file.total);
                display.set_current_progress(file.current);
                display.set_duration(file.current_duration);
                display.set_estimated_duration(file.estimated_duration);
            }
            Progresses::End => display.set_total_progress(1.0)
        }
    }
}

static PROGRESS_SENDER: OnceLock<Arc<Mutex<Sender<Progresses>>>> = OnceLock::new();

