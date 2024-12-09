#![allow(dead_code)]
use core::str;
use std::{io::{BufRead, BufReader, BufWriter, Read, Write}, net::TcpStream, sync::mpsc::Receiver};

use serde::de::DeserializeOwned;

use crate::{directory::copy_not_cancelled, request_error::{ErrorType, RequestError}};

pub struct WebRequest {
    headers: Vec<String>,
    buf_reader: BufReader<TcpStream>,
    buf_writer: BufWriter<TcpStream>
}

impl WebRequest {
    pub fn get(ip: &str, url: String) -> Result<WebRequest, RequestError> {
        let stream = TcpStream::connect(format!("{}:8080", ip))?; 
        let mut wr = WebRequest::new(stream)?;
        let payload = format!("GET {url} HTTP/1.1\r\n\r\n");
        wr.buf_writer.write_all(payload.as_bytes())?;
        wr.buf_writer.flush()?;
   
        loop {
            let mut str = String::new();
            wr.buf_reader.read_line(&mut str)?;
            str = str.trim().to_string();
            if str.len() == 0 {
                break;
            }
            wr.headers.push(str);
        }

        if wr.headers.len() == 0  { 
            return Err(RequestError { status: crate::request_error::ErrorType::FileNotFound });
        }
        let request_line = &mut wr.headers[0];
        let status = match request_line.find(" ") {
            Some(pos) => request_line.split_off(pos),
            _ => return Err(RequestError { status: crate::request_error::ErrorType::FileNotFound })
        };
        match status.trim() {
            s if s.starts_with("200") => {}
            s if s.starts_with("404") => return Err(RequestError { status: crate::request_error::ErrorType::FileNotFound }),
            _ => return Err(RequestError { status: crate::request_error::ErrorType::Unknown }),
        };

        Ok(wr)
    }

    pub fn to<T>(&mut self) -> Result<T, RequestError> 
    where T: DeserializeOwned {
        if let Some(len) = self.get_header(CONTENT_LENGTH).map(|l|l.parse::<usize>().unwrap_or(0)) {
            let mut buf: Vec<u8> = vec![0; len];
            self.buf_reader.read_exact(&mut buf)?;
            let res = serde_json::from_slice::<T>(&buf)?;
            Ok(res)
        } else {
            return Err(RequestError { status: crate::request_error::ErrorType::FileNotFound })
        }
    }

    pub fn get_header<'a>(&'a self, header: &str)-> Option<&'a str> {
        self
            .headers
            .iter()
            .find(|h|h.starts_with(header))
            .map(|v| &v[header.len()+2..] )
    }

    pub fn download<W>(&mut self, writer: &mut W, rcv: &Receiver<bool>) -> Result<(), RequestError>
    where W: ?Sized + Write {
        if let Some(mut len) = self.get_header(CONTENT_LENGTH).map(|l|l.parse::<usize>().unwrap_or(0)) {
            let mut buf = vec![0; usize::min(8192, len)];
            while copy_not_cancelled(rcv) {
                let buf_slice = &mut buf[..usize::min(8192, len)];
                let read = self.buf_reader.read(buf_slice)?;
                len = len - read;
                let buf_slice = &mut buf[..read];
                writer.write(buf_slice)?;
                if len <= 0 {
                    break
                }
            }
            Ok(())
        } else {
            Err(RequestError { status: crate::request_error::ErrorType::FileNotFound })
        }
    }

    pub fn put<R>(ip: &str, url: String, reader: &mut R, len: usize, modified: Option<i64>, rcv: &Receiver<bool>) -> Result<WebRequest, RequestError> 
    where R: ?Sized + Read {
        let stream = TcpStream::connect(format!("{}:8080", ip))?; 
        let mut wr = WebRequest::new(stream)?;
        let payload = format!("PUT {url} HTTP/1.1\r\nContent-Length: {len}{}\r\n\r\n", match modified {
            Some(m) => format!("\r\nx-file-date: {m}"),
            None => "".to_string()
        });
        wr.buf_writer.write_all(payload.as_bytes())?;
        wr.upload(reader, len, rcv)?;
        wr.buf_writer.flush()?;
   
        loop {
            let mut str = String::new();
            wr.buf_reader.read_line(&mut str)?;
            str = str.trim().to_string();
            if str.len() == 0 {
                break;
            }
            wr.headers.push(str);
        }

        if wr.headers.len() == 0  { 
            return Err(RequestError { status: crate::request_error::ErrorType::FileNotFound });
        }
        let request_line = &mut wr.headers[0];
        let status = match request_line.find(" ") {
            Some(pos) => request_line.split_off(pos),
            _ => return Err(RequestError { status: crate::request_error::ErrorType::FileNotFound })
        };
        match status.trim() {
            s if s.starts_with("200") || s.starts_with("204") => {}
            s if s.starts_with("404") => return Err(RequestError { status: crate::request_error::ErrorType::FileNotFound }),
            _ => return Err(RequestError { status: crate::request_error::ErrorType::Unknown }),
        };

        Ok(wr)
    }

    fn upload<R>(&mut self, reader: &mut R, mut len: usize, rcv: &Receiver<bool>) -> Result<(), RequestError>
    where R: ?Sized + Read {
        let mut buf = vec![0; usize::min(8192, len)];
        loop {
            if !copy_not_cancelled(rcv) {
                return Err(RequestError { status: ErrorType::Cancelled })
            }

            let buf_slice = &mut buf[..usize::min(8192, len)];
            let read = reader.read(buf_slice)?;
            len = len - read;
            let buf_slice = &mut buf[..read];
            self.buf_writer.write(buf_slice)?;
            if len <= 0 {
                break
            }
        }
        Ok(())
    }

    fn new(stream: TcpStream) -> Result<WebRequest, RequestError> {
        let buf_reader = BufReader::new(stream.try_clone()?); 
        let buf_writer = BufWriter::new(stream);
        Ok(WebRequest {
            headers: Vec::new(), 
            buf_reader, 
            buf_writer
        })
    }

}

pub static CONTENT_LENGTH: &str = "Content-Length";
