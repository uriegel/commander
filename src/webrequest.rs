#![allow(dead_code)]
use core::str;
use std::{io::{BufRead, BufReader, BufWriter, Read, Write}, net::TcpStream, sync::mpsc::Receiver};

use serde::de::DeserializeOwned;

use crate::request_error::RequestError;

pub struct WebRequest {
    headers: Vec<String>,
    buf_reader: BufReader<TcpStream>
}

impl WebRequest {
    pub fn get(ip: &str, url: String) -> Result<WebRequest, RequestError> {
        let stream = TcpStream::connect(format!("{}:8080", ip))?; 
        let mut buf_writer = BufWriter::new(&stream);
        let mut wr = WebRequest::new(stream.try_clone()?);
        let payload = format!("GET {url} HTTP/1.1\r\n\r\n");
        buf_writer.write_all(payload.as_bytes())?;
        buf_writer.flush()?;
   
        loop {
            let mut str = String::new();
            wr.buf_reader.read_line(&mut str)?;
            str = str.trim().to_string();
            if str.len() == 0 {
                break;
            }
            wr.headers.push(str);
        }
        // TODO Read Status Code
    
    
        if wr.headers.len() == 0  { 
            return Err(RequestError { status: crate::request_error::ErrorType::FileNotFound });
        }

        let _request_line = &wr.headers[0];

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
            while let Err(std::sync::mpsc::TryRecvError::Empty) = rcv.try_recv() {
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

    fn new(stream: TcpStream) -> WebRequest {
        WebRequest {
            headers: Vec::new(), 
            buf_reader: BufReader::new(stream.try_clone().unwrap()), 
        }
    }

}

pub static CONTENT_LENGTH: &str = "Content-Length";
