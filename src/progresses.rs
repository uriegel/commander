#![allow(dead_code)]
use std::{cell::RefCell, io::{BufWriter, Write}};

use chrono::Local;

#[cfg(target_os = "linux")]
use crate::linux::progresses::{start_progress, file_progress, end_progress, bytes_progress};

pub struct TotalProgress {
    total_size: u64, 
    total_files: u32, 
    mov: bool,
    current_size: RefCell<u64>,
    current_files: RefCell<u32>,
    last_updated: RefCell<i64>
}

impl TotalProgress {
    pub fn new(total_size: u64, total_files: u32, mov: bool) -> Self {
        start_progress(total_files, total_size, mov);
        Self {
            total_size, 
            total_files, 
            mov, 
            current_size: RefCell::new(0), 
            last_updated: RefCell::new(0), 
            current_files: RefCell::new(1)
        }
    }

    pub fn add_size(&self, size: u64) {
        let current = self.current_size.take();
        self.current_size.replace(current + size);
    }

    pub fn reset_updated(&self, updated: i64) {
        self.last_updated.replace(updated);
    }

    pub fn add_file(&self) {
        let current = self.current_files.take();
        self.current_files.replace(current + 1);
    }
}

pub struct CurrentProgress<'a> {
    total: &'a TotalProgress,
    name: &'a str,
    size: u64    
}

impl<'a> CurrentProgress<'a> {
    pub fn new(total: &'a TotalProgress, name: &'a str, size: u64) -> Self {
        let cp = Self {
            total, name, size
        };
        cp.send_file();
        cp
    }

    pub fn send_file(&self) {
        let now = Local::now().timestamp_millis();
        if now > self.total.last_updated.borrow().clone() + FRAME_DURATION {
            let progress = if self.total.total_size > 0 { 
                self.total.current_size.borrow().clone() as f64 / self.total.total_size as f64 
            } else { 
                0.0 
            }; 
            file_progress(self.name.to_string(), progress, self.total.current_files.borrow().clone());
            self.total.reset_updated(now);
        }
    }

    pub fn send_bytes(&self, size: u64) {
        let now = Local::now().timestamp_millis();
        if size == self.size || now > self.total.last_updated.borrow().clone() + FRAME_DURATION {
            self.total.reset_updated(now);
            bytes_progress(size, self.size, self.total.current_size.borrow().clone() + size, self.total.total_size);
        }
    }
}

impl Drop for TotalProgress {
    fn drop(&mut self) {
        end_progress();
    }
}

impl<'a> Drop for CurrentProgress<'a> {
    fn drop(&mut self) {
        self.total.add_size(self.size);
        self.total.add_file();
    }
}

#[derive(Default, Clone, Copy)]
pub struct ProgressFiles<'a> {
    pub index: u32,
    #[allow(dead_code)]
    pub file: &'a str,
    current_bytes: u64,
    current_size: u64,
}

impl<'a> ProgressFiles<'a> {
    pub fn get_current_bytes(&self)->u64 {
        self.current_bytes - self.current_size
    }

    pub fn get_next(&self, file: &'a str, file_size: u64)->Self {
        ProgressFiles { 
            index: self.index + 1, 
            file, 
            current_bytes: self.current_bytes + file_size,  
            current_size: file_size,
        }        
    }
}

pub struct ProgressStream<'a, W> 
where W: Sized + Write {
    writer : BufWriter<W>,
    size: usize,
    read: usize,
    on_progress: Box<dyn FnMut(usize, usize) + 'a>
}

impl<'a, W> ProgressStream<'a, W> 
where W: Sized + Write {
    pub fn new(writer: BufWriter<W>, size: usize, on_progress: impl FnMut(usize, usize) + 'a) -> Self 
    where W: Sized + Write {    
        Self { writer, read: 0, size, on_progress: Box::new(on_progress) }
    }
}

impl<'a, W> Write for ProgressStream<'a, W>
where W: Sized + Write {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let read = self.writer.write(buf)?;
        self.read = self.read + read;
        (self.on_progress)(self.read, self.size);
        Ok(read)
    }

    fn flush(&mut self) -> std::io::Result<()> {
        self.writer.flush()
    }
}

const FRAME_DURATION: i64 = 40;

/*
Linux:
2. FilesProgress: name, progress (current/total), current count
3. FileProgress: current (current, total), total (current, total), current duration
4. Error: current (0, 1), total (total, total), current duration: 0

Lacking: Finished

Windows:
2. ProgressFile: name, progress (current), current count
3. ProgressBytes: current_bytes, total_bytes, total_seconds
4. ProgressFinished: total seconds

Differences: total seconds (Windows) current seconds (Linux)
+ Linux: total seconds
+ Windows: current seconds
+ both: send progresses as rationals

*/