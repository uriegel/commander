use std::{io::BufWriter, net::TcpStream, sync::{Arc, Mutex}};

use include_dir::Dir;

use crate::{directory::get_file, error::Error, httpserver::{httpserver::{route_not_found, send_bytes, send_stream}, request::Request}};
#[cfg(target_os = "linux")]
use crate::linux::directory::get_icon;
#[cfg(target_os = "windows")]
use crate::windows::directory::get_icon;

pub fn route_get(mut request: Request, webroot: Option<Arc<Mutex<Dir<'static>>>>)->Result<(), Error> {
    let pos = request.request_line[4..].find(" ").unwrap_or(0);
    let path = request.request_line[4..pos + 4].to_string();

    match (webroot, path) {
        (Some(webroot), path) if path.starts_with("/webroot") => {
            let end_pos = path.find('?');
            route_get_webroot(request.writer, if let Some(end_pos) = end_pos { &path[9..end_pos] } else { &path[9..] }, webroot)
        },
        (_, path) if path.starts_with("/geticon") => {
            match get_icon(&path[14..]) {
                Ok((icon_ext, icon)) => send_bytes(request.writer, &icon_ext, icon.as_slice(), "HTTP/1.1 200 OK"),
                _ => route_not_found(request.writer)
            }
        },
        (_, path) if path.starts_with("/getfile") => {
            match get_file(&path[14..]) {
                Ok((ext, file)) => {
                    let size = file.metadata()?.len();
                    send_stream(&mut request, &ext, file, size, "HTTP/1.1 200 OK")
                },
                _ => route_not_found(request.writer)
            }
        },
        (_, _) => route_not_found(request.writer)
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

