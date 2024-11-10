use std::sync::{Arc, Mutex};

use async_channel::Sender;
use chrono::Local;

use super::progress_display::ProgressDisplay;

pub fn set_progress_sender(snd: Sender<Progresses>) {
    unsafe { PROGRESS_SENDER = Some(Arc::new(Mutex::new(snd))) };
}

#[derive(Debug, Clone, Copy)]
pub struct ProgressControl {
    total_size: u64,
    last_updated: Option<i64>,
    start_time: i64
}

impl ProgressControl {
    pub fn new(total_size: u64, total_files: u32, mov: bool)->Self {
        let sender = get_sender().lock().unwrap();
        let _ = sender.send_blocking(Progresses::Start(FilesProgressStart {total_files, total_size, mov }));
        Self { total_size , last_updated: None, start_time: Local::now().timestamp() }
    }

    pub fn send_file(&mut self, file: &str, current_size: u64, current_count: u32) {
        let sender = get_sender().lock().unwrap();
        self.last_updated.replace(Local::now().timestamp_millis() - FRAME_DURATION);
        let _ = sender.send_blocking(Progresses::Files(FilesProgress {
            current_name: file.to_string(), 
            progress: current_size as f64 / self.total_size as f64, 
            current_files: current_count 
        }));
    }

    pub fn send_progress(&mut self, current: u64, total: u64, total_current: u64) {
        let now = Local::now().timestamp_millis();
        if current == total || now > self.last_updated.unwrap_or_default() + FRAME_DURATION {
            self.last_updated.replace(now);
            let sender = get_sender().lock().unwrap();
            let _ = sender.send_blocking(Progresses::File(FileProgress { 
                current: Progress { current, total }, 
                total: Progress { current: current + total_current , total: self.total_size },
                current_duration: ((now/1000) - self.start_time) as i32
            }));
        }
    }

    pub fn send_error(&mut self) {
        let sender = get_sender().lock().unwrap();
        let _ = sender.send_blocking(Progresses::File(FileProgress { 
            current: Progress { current: 0, total: 1 }, 
            total: Progress { current: self.total_size , total: self.total_size },
            current_duration: 0
        }));
    }
}

pub enum Progresses {
    Start(FilesProgressStart),
    Files(FilesProgress),
    File(FileProgress),
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
    pub current: Progress,
    pub total: Progress,
    pub current_duration: i32
}

#[derive(Default)]
pub struct Progress {
    pub current: u64,
    pub total: u64    
}

fn get_sender()->&'static Arc<Mutex<Sender<Progresses>>> {
    unsafe {
        PROGRESS_SENDER.as_ref().unwrap()        
    }
}

impl Progresses {
    pub fn display_progress(&self, display: &ProgressDisplay) {
        match self {
            Progresses::Start(start) => {
                display.set_total_count(start.total_files as i32);        
                display.set_size(start.total_size);
                display.set_total_progress(0.0);
                display.set_mov(start.mov);
            } 
            Progresses::Files(files) => {
                display.set_current_count(files.current_files as i32);        
                display.set_current_name(files.current_name.clone());
                display.set_total_progress(files.progress);
            } 
            Progresses::File(file) => {
                let total_progress = file.total.current as f64 / file.total.total as f64;
                display.set_total_progress(total_progress);
                let progress = file.current.current as f64 / file.current.total as f64;
                display.set_current_progress(progress);
                display.set_duration(file.current_duration);
                display.set_estimated_duration((file.current_duration as f64 / total_progress) as i32);
            } 
        }
    }
}

static mut PROGRESS_SENDER: Option<Arc<Mutex<Sender<Progresses>>>> = None;

const FRAME_DURATION: i64 = 40;
