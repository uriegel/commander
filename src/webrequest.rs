use std::{io::{BufRead, BufReader, BufWriter, Read, Write}, net::TcpStream};

use crate::request_error::RequestError;

pub fn web_get(ip: &str, url: String) -> Result<(), RequestError> {
    let stream = TcpStream::connect(format!("{}:8080", ip))?; 
    let mut buf_writer = BufWriter::new(&stream);
    let mut buf_reader = BufReader::new(&stream);
    let payload = format!("GET {url} HTTP/1.1\r\n\r\n");
    buf_writer.write_all(payload.as_bytes())?;
    buf_writer.flush()?;
    let mut result_string = String::new();

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

    // TODO Read Status Code
    // TODO read content_length
    // TODO payload

    if headers.len() == 0  { 
        return Ok(())
    }

    Ok(())
}