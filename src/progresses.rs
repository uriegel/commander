use std::sync::{Arc, Mutex};

use async_channel::Sender;

use crate::linux::progress_display::ProgressDisplay;

pub fn set_progress_sender(snd: Sender<Progresses>) {
    unsafe { PROGRESS_SENDER = Some(Arc::new(Mutex::new(snd))) };
}

pub struct ProgressControl {
    total_size: u64,
    count: u32
}

impl ProgressControl {
    pub fn new(total_size: u64, total_files: u32)->Self {
        let sender = get_sender().lock().unwrap();
        let _ = sender.send_blocking(Progresses::Start(FilesProgressStart {total_files, total_size }));
        Self { total_size, count: total_files }
    }

    pub fn send_file(&self, file: &str, current_size: u64, current_count: u32) {
        let sender = get_sender().lock().unwrap();
        let _ = sender.send_blocking(Progresses::Files(FilesProgress {
            current_name: file.to_string(), 
            progress: current_size as f64 / self.total_size as f64, 
            current_files: current_count 
        }));
        // TODO file progress
        println!("kopiere... {}, {}, {}", file, current_size, current_count);
    }
}

// TODO debounce 40ms before sending via channel (or via SendJavscript in Windows)
pub enum Progresses {
    Start(FilesProgressStart),
    Files(FilesProgress),
    File(FileProgress),
}

impl Progresses {
    pub fn display_progress(&self, display: &ProgressDisplay) {
        match self {
            Progresses::Start(start) => {
                display.set_total_count(start.total_files as i32);        
                display.set_total_progress(0.0);
            } 
            Progresses::Files(files) => {
                display.set_current_count((files.current_files as i32) + 1);        
                display.set_current_name(files.current_name.clone());
                display.set_total_progress(files.progress);
            } 
            _ => {}
        }
        // let total_progress = self.total.current as f64 / self.total.total as f64;
        // display.set_total_progress(total_progress);
        // let progress = self.current.current as f64 / self.current.total as f64;
        // display.set_current_progress(progress);
        // display.set_current_name(self.current_name.clone());
        // display.set_current_count(self.current_count + 1);
        // display.set_total_count(self.total_count);
    }
}

#[derive(Default)]
pub struct FilesProgressStart {
    pub total_size: u64,
    pub total_files: u32,
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

static mut PROGRESS_SENDER: Option<Arc<Mutex<Sender<Progresses>>>> = None;

/*
                // TODO TEST Revealer progress: total bytes
                // TODO TEST Revealer progress: remaining time
                // TODO TEST Revealer progress: time
                std::thread::spawn(|| {
                    let sender = get_sender().lock().unwrap();
                    let count = 3;
                    let size:u64 = 2222;
                    let frame_duration = Duration::from_millis(40);
                    let mut now = Local::now();
                    for i in 0..count {
                        let file_name = match i {
                            0 => "Ein erste Datei.png".to_string(),
                            1 => "Die 2. Datei.jpg".to_string(),
                            _ => "Die letzte Datei.htm".to_string(),
                        };
                        for j in 0..size {
                            if Local::now() > now + frame_duration {
                                now = Local::now();
                                let progress = Progresses { 
                                    total: Progress { 
                                        current: j+i*size,
                                        total: size*count 
                                    }, 
                                    current: Progress {
                                        current: j, 
                                        total: size
                                    },
                                    current_name: file_name.clone(),
                                    current_count : i as i32,
                                    total_count: count as i32
                                };
                                let _ = sender.send_blocking(progress);
                            }
                            thread::sleep(Duration::from_millis(5));
                        }
                        let progress = Progresses { 
                            total: Progress { 
                                current: size*count,
                                total: size*count 
                            }, 
                            current: Progress {
                                current: size, 
                                total: size
                            },
                            current_name: "".to_string(),
                            current_count : (count-1) as i32,
                            total_count: count as i32
                        };
                        let _ = sender.send_blocking(progress);
                    }
                });
 */