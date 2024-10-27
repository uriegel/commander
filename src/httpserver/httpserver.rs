use core::str;
use std::{io::{BufRead, BufReader, BufWriter, Write}, net::{TcpListener, TcpStream}, sync::{Arc, Mutex}, thread};

use include_dir::Dir;

use crate::{directory::get_file, error::Error};
#[cfg(target_os = "linux")]
use crate::linux::directory::get_icon;
#[cfg(target_os = "windows")]
use crate::windows::directory::get_icon;
use super::{html, threadpool::ThreadPool};

#[derive(Clone)]
pub struct HttpServer {
    pub port: u32,
}

pub struct HttpServerBuilder {
    port: u32
}

impl HttpServerBuilder {
    pub fn new()->Self {
        HttpServerBuilder { port: 7000 }
    }
        
    pub fn port(mut self, val: u32)->Self {
        self.port = val;
        self
    }

    pub fn build(&self)->HttpServer {
        HttpServer {
            port: self.port
        }
    }
}

impl HttpServer {
    pub fn run(&self, webroot: Option<Arc<Mutex<Dir<'static>>>>) {
        let listener = TcpListener::bind(format!("127.0.0.1:{}", self.port)).unwrap();
        let pool = ThreadPool::new(8);
        thread::spawn(move || for stream in listener.incoming() {
            let webroot = webroot.clone();
            if let Ok(stream) = stream {
                pool.execute(move|| {
                    handle_connection(stream, webroot);     
                });
            } else {
                break;
            }
        });
    }
}

fn handle_connection(stream: TcpStream, webroot: Option<Arc<Mutex<Dir<'static>>>>) {
    stream.set_nodelay(true).unwrap(); // disables Nagle algorithm
    loop {
        let mut buf_reader = BufReader::new(&stream);
        let buf_writer = BufWriter::new(&stream);
        
        let mut headers: Vec<String> = Vec::new();
        loop {
            let mut str = String::new();
            buf_reader.read_line(&mut str).unwrap();
            str = str.trim().to_string();
            if str.len() == 0 {
                break;
            }
            headers.push(str);
        }

        if headers.len() == 0  { 
            return 
        }
        let request_line = &headers[0];

        let result = match request_line {
            request_line if request_line.starts_with("GET") => {
                route_get(buf_writer, request_line, webroot.clone())
            },
            _ => route_not_found(buf_writer)
        };

        match result {
            Err(err) => println!("{}", err),
            _ => ()
        };
    }

    fn route_get(writer: BufWriter<&TcpStream>, request_line: &String, webroot: Option<Arc<Mutex<Dir<'static>>>>)->Result<(), Error> {
        let pos = request_line[4..].find(" ").unwrap_or(0);
        let path = request_line[4..pos + 4].to_string();

        match (webroot, path) {
            (Some(webroot), path) if path.starts_with("/webroot") => {
                let end_pos = path.find('?');
                route_get_webroot(writer, if let Some(end_pos) = end_pos { &path[9..end_pos] } else { &path[9..] }, webroot)
            },
            (_, path) if path.starts_with("/geticon") => {
                let (icon_ext, icon) = get_icon(&path[14..])?;
                send_bytes(writer, &icon_ext, icon.as_slice(), "HTTP/1.1 200 OK")
            },
            (_, path) if path.starts_with("/getfile") => {
                let (ext, file) = get_file(&path[14..])?;
                send_bytes(writer, &ext, file.as_slice(), "HTTP/1.1 200 OK")
            },
            (_, _) => route_not_found(writer)
        }
    }

    fn route_get_webroot(writer: BufWriter<&TcpStream>, path: &str, webroot: Arc<Mutex<Dir<'static>>>)->Result<(), Error> {
        match webroot
                .lock()
                .map_err(|err|Error::new(&format!("{}", err)))
                ?.get_file(path) 
                .map(|file| file.contents()) {
            Some(bytes) => {
                send_bytes(writer, path, bytes, "HTTP/1.1 200 OK")
            },
            None => route_not_found(writer)
        }
    }

    fn route_not_found(writer: BufWriter<&TcpStream>)->Result<(), Error> {
        send_html(writer, &html::not_found(), "HTTP/1.1 404 NOT FOUND")
    }

    fn send_html(mut writer: BufWriter<&TcpStream>, html: &str, status_line: &str)->Result<(), Error> {
        let length = html.len();
        
        let response = format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{html}");
        writer.write_all(response.as_bytes())?;
        writer.flush()?;
        Ok(())
    }
}

fn send_bytes(mut writer: BufWriter<&TcpStream>, path: &str, payload: &[u8], status_line: &str)->Result<(), Error> {
    let length = payload.len();
    
    // TODO compare_lowercase
    let content_type = match path {
        path if path.ends_with(".html") => "text/html",
        path if path.ends_with(".css") => "text/css",
        path if path.ends_with(".js") => "text/javascript",
        path if path.ends_with(".jpg") => "image/jpg",
        path if path.ends_with(".png") => "image/png",
        path if path.ends_with(".pdf") => "application/pdf",
        _ => "text/plain",
    };

    let response = format!("{status_line}\r\nContent-Length: {length}\r\nContent-Type: {content_type}\r\n\r\n");
    writer.write_all(response.as_bytes())?;
    writer.write_all(payload)?;
    writer.flush()?;
    Ok(())
}
