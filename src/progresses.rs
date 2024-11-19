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

