use core::str;
use std::{fs::File, io::{BufRead, BufReader, BufWriter, Read, Seek, Write}, net::{TcpListener, TcpStream}, path::PathBuf, process::Command, sync::{Arc, Mutex}, thread};

use include_dir::Dir;
use urlencoding::decode;

use crate::{error::Error, httpserver::range::send_range, requests_http::route_get, str::StrExt};
use super::{html, request::Request, threadpool::ThreadPool};

#[derive(Clone)]
pub struct HttpServer {
    pub port: u32,
}

pub struct HttpServerBuilder {
    port: u32
}

pub fn route_not_found(writer: BufWriter<&TcpStream>)->Result<(), Error> {
    send_html(writer, &html::not_found(), "HTTP/1.1 404 NOT FOUND")
}

pub fn send_bytes(mut writer: BufWriter<&TcpStream>, path: &str, payload: &[u8], status_line: &str)->Result<(), Error> {
    let length = payload.len();
    let content_type = get_content_type(path);
    let response = format!("{status_line}\r\nContent-Length: {length}\r\nContent-Type: {content_type}\r\n\r\n");
    writer.write_all(response.as_bytes())?;
    writer.write_all(payload)?;
    writer.flush()?;
    Ok(())
}

pub fn send_stream(request: &mut Request, path: &str, stream: impl Read+Seek, len: u64, status_line: &str)->Result<(), Error> {
    let content_type = get_content_type(path);
    if content_type.starts_with("audio") || content_type.starts_with("video") {
        send_range(request, stream, len, status_line, content_type)?;
    } else if content_type == "image/heic" {
        let pos_end = path.find('?');
        let path = if let Some(pos_end) = pos_end { &path[..pos_end] } else { path };
        let path = decode(path)?.to_string();

        // TODO Windows
        let output_path = PathBuf::from("/tmp/output.jpg");
        //let resa = fs::copy(path, output_path);
        //  println!("resa {:?}", resa);

        Command::new("ffmpeg")
            .arg("-i")
            .arg(path)
            .arg(output_path.to_string_lossy().to_string())
            .arg("-y")
            .output()?;
        let stream = File::open(&output_path)?;
        let len = stream.metadata()?.len();
        send_complete_stream(request, stream, len, status_line, content_type)?;
        

    } else {
        send_complete_stream(request, stream, len, status_line, content_type)?;
    }
    Ok(())
}

pub fn send_complete_stream(request: &mut Request, mut stream: impl Read+Seek, len: u64, status_line: &str, content_type: &str)->Result<(), Error> {
    let response = format!("{status_line}\r\nContent-Length: {len}\r\nContent-Type: {content_type}\r\n\r\n");
    request.writer.write_all(response.as_bytes())?;

    let mut buf = [0u8; 8192];
    loop {
        let read = stream.read(&mut buf)?;
        request.writer.write_all(&buf)?;    
        if read < buf.len() {
            break
        }
    }
    request.writer.flush()?;
    Ok(())
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
                    let _ = handle_connection(stream, webroot).inspect_err(|e|eprintln!("Error http: {}", e));     
                });
            } else {
                break;
            }
        });
    }
}

fn handle_connection(stream: TcpStream, webroot: Option<Arc<Mutex<Dir<'static>>>>)->Result<(), Error> {
    let _ = stream.set_nodelay(true); // disables Nagle algorithm
    loop {
        let mut buf_reader = BufReader::new(&stream);
        let buf_writer = BufWriter::new(&stream);
        
        let mut headers: Vec<String> = Vec::new();
        loop {
            let mut str = String::new();
            buf_reader.read_line(&mut str)?;
            str = str.trim().to_string();
            if str.len() == 0 {
                break;
            }
            headers.push(str);
        }

        if headers.len() == 0  { 
            return Ok(())
        }
        let request_line = &headers[0];

        let result = match request_line {
            request_line if request_line.starts_with("GET") => {
                route_get(Request {
                    writer: buf_writer,
                    request_line,
                    headers: &headers 
                }, webroot.clone())
            },
            _ => route_not_found(buf_writer)
        };

        match result {
            Err(err) => println!("{}", err),
            _ => ()
        };
    }
}

fn get_content_type(path: &str)->&str {
    match path {
        path if path.ext_is(".html") => "text/html",
        path if path.ext_is(".css") => "text/css",
        path if path.ext_is(".js") => "text/javascript",
        path if path.ext_is(".jpg") => "image/jpg",
        path if path.ext_is(".heic") => "image/heic",
        path if path.ext_is(".png") => "image/png",
        path if path.ext_is(".pdf") => "application/pdf",
        path if path.ext_is(".mp4") => "video/mp4",
        path if path.ext_is(".mkv") => "video/mkv",
        path if path.ext_is(".mov") => "video/mov",
        path if path.ext_is(".mp3") => "audio/mp3",
        path if path.ext_is(".ogg") => "audio/ogg",
        path if path.ext_is(".aac") => "audio/aac",
        path if path.ext_is(".html") => "text/html; charset=utf-8",
        _ => "text/plain; charset=utf-8"
    }
}

fn send_html(mut writer: BufWriter<&TcpStream>, html: &str, status_line: &str)->Result<(), Error> {
    let length = html.len();
    
    let response = format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{html}");
    writer.write_all(response.as_bytes())?;
    writer.flush()?;
    Ok(())
}
