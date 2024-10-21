use core::str;
use std::{fs, io::{BufRead, BufReader, BufWriter, Write}, net::{TcpListener, TcpStream}, sync::{Arc, Mutex}, thread};

use include_dir::Dir;

use crate::linux::directory::get_icon;

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

        match request_line {
            request_line if request_line.starts_with("GET") => {
                route_get(buf_writer, request_line, webroot.clone());    
            },
            _ => route_not_found(buf_writer)
        };
    }

    fn route_get(writer: BufWriter<&TcpStream>, request_line: &String, webroot: Option<Arc<Mutex<Dir<'static>>>>) {
        let pos = request_line[4..].find(" ").unwrap_or(0);
        let path = request_line[4..pos + 4].to_string();

        match (webroot, path) {
            (Some(webroot), path) if path.starts_with("/webroot") =>
                route_get_webroot(writer, &path[9..], webroot),
            (_, path) if path.starts_with("/geticon") => {
                let icon_path = get_icon(&path[14..]);
                if icon_path.len() > 0 {
                    let payload = fs::read(icon_path.clone()).unwrap();
                    send_bytes(writer, &icon_path, payload.as_slice(), "HTTP/1.1 200 OK")
                } else {
                    let icon_path = get_icon("");
                    if icon_path.len() > 0 {
                        let payload = fs::read(icon_path.clone()).unwrap();
                        send_bytes(writer, &icon_path, payload.as_slice(), "HTTP/1.1 200 OK")
                    } else {
                        route_not_found(writer)  
                    }
                        
                }
            },
            (_, _) => route_not_found(writer)
        };
    }

    fn route_get_webroot(writer: BufWriter<&TcpStream>, path: &str, webroot: Arc<Mutex<Dir<'static>>>) {
        match webroot
                .lock()
                .unwrap()
                .get_file(path) 
                .map(|file| file.contents()) {
            Some(bytes) => {
                send_bytes(writer, path, bytes, "HTTP/1.1 200 OK");
            },
            None => route_not_found(writer)
        };    
    }

    fn route_not_found(writer: BufWriter<&TcpStream>) {
        send_html(writer, &html::not_found(), "HTTP/1.1 404 NOT FOUND"); 
    }

    fn send_html(mut writer: BufWriter<&TcpStream>, html: &str, status_line: &str) {
        let length = html.len();
        
        let response = format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{html}");
        writer.write_all(response.as_bytes()).unwrap();
        writer.flush().unwrap();
    }
}

fn send_bytes(mut writer: BufWriter<&TcpStream>, path: &str, payload: &[u8], status_line: &str) {
    let length = payload.len();
    
    let content_type = match path {
        path if path.ends_with(".html") => "text/html",
        path if path.ends_with(".css") => "text/css",
        path if path.ends_with(".js") => "text/javascript",
        _ => "text/plain",
    };

    let response = format!("{status_line}\r\nContent-Length: {length}\r\nContent-Type: {content_type}\r\n\r\n");
    writer.write_all(response.as_bytes()).unwrap();
    writer.write_all(payload).unwrap();
    writer.flush().unwrap();
}
