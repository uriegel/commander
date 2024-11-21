#![allow(dead_code)]
use std::io::{BufWriter, Write};

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

// TODO struct for total settings
// TODO struct for current settings

/*
Linux:
1. Start; total size, total count, move
   saved: timestamp
2. FilesProgress: name, progress (current/total), current count
3. FileProgress: current (current, total), total (current, total), current duration
4. Error: current (0, 1), total (total, total), current duration: 0

Lacking: Finished

Windows:
1. Start: total size, total count, move, Kind
2. ProgressFile: name, progress (current), current count
3. ProgressBytes: current_bytes, total_bytes, total_seconds
4. ProgressFinished: total seconds

Differences: total seconds (Windows) current seconds (Linux)
+ Linux: total seconds
+ Windows: current seconds
+ both: send progresses as rationals

*/