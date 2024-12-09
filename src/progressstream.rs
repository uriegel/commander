use std::io::{BufReader, BufWriter, Read, Write};

pub struct ProgressReadStream<'a, R> 
where R: Sized + Read {
    reader : BufReader<R>,
    read: usize,
    on_progress: Box<dyn FnMut(usize) + 'a>
}

pub struct ProgressWriteStream<'a, W> 
where W: Sized + Write {
    writer : BufWriter<W>,
    read: usize,
    on_progress: Box<dyn FnMut(usize) + 'a>
}

impl<'a, R> ProgressReadStream<'a, R> 
where R: Sized + Read {
    pub fn new(reader: BufReader<R>, on_progress: impl FnMut(usize) + 'a) -> Self 
    where R: Sized + Read {    
        Self { reader, read: 0, on_progress: Box::new(on_progress) }
    }
}

impl<'a, R> Read for ProgressReadStream<'a, R>
where R: Sized + Read {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let read = self.reader.read(buf)?;
        self.read = self.read + read;
        (self.on_progress)(self.read);
        Ok(read)
    }
}

impl<'a, W> ProgressWriteStream<'a, W> 
where W: Sized + Write {
    pub fn new(writer: BufWriter<W>, on_progress: impl FnMut(usize) + 'a) -> Self 
    where W: Sized + Write {    
        Self { writer, read: 0, on_progress: Box::new(on_progress) }
    }

    pub fn flush(&mut self)->std::io::Result<()> {
        self.writer.flush()
    }
}

impl<'a, W> Write for ProgressWriteStream<'a, W>
where W: Sized + Write {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let read = self.writer.write(buf)?;
        self.read = self.read + read;
        (self.on_progress)(self.read);
        Ok(read)
    }

    fn flush(&mut self) -> std::io::Result<()> {
        self.writer.flush()
    }
}
