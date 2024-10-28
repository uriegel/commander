use std::io::{Read, Seek, SeekFrom, Write};

use crate::error::Error;

use super::{httpserver::send_complete_stream, request::Request};

pub fn send_range(request: &mut Request, mut stream: impl Read+Seek, len: u64, status_line: &str, content_type: &str)->Result<(), Error> {
    if let Some(range_header) = request.headers.iter().find(|h|h.starts_with("Range: ")) {
        let (start_range, end_range) = get_range_params(&range_header[7..], len)?;
        let byte_count = end_range - start_range + 1;
        stream.seek(SeekFrom::Start(start_range))?;

        let response = format!("HTTP/1.1 206 Partial Content\r\nContent-Length: {byte_count}\r\nContent-Type: {content_type}\r\nAccept-Ranges: bytes\r\nContent-Range: bytes {start_range}-{end_range}/{len}\r\n\r\n");
        request.writer.write_all(response.as_bytes())?;
    
        let mut buf = [0u8; 16384];
        let cycles = byte_count / buf.len() as u64 + 1;
        let mut sent_bytes: u64 = 0;        
        for _ in 0..cycles-1 {
            stream.read_exact(&mut buf)?;
            request.writer.write_all(&buf)?;    
            sent_bytes += buf.len() as u64;            
        }
        let mut buf: Vec<u8> = vec![0; (byte_count - sent_bytes) as usize];
        stream.read_exact(&mut buf)?;
        request.writer.write_all(&buf)?;    
        request.writer.flush()?;
    } else {
        send_complete_stream(request, stream, len, status_line, content_type)?;    
    }
    Ok(())
}

fn get_range_params(range: &str, size: u64)->Result<(u64, u64), Error> {
    let range: Vec<String> = range
        .replace("bytes=", "")
        .split("-")
        .filter_map(|n| if n.len() > 0 {Some(n.to_string())} else {None})
        .collect();
    let start = if range.len() > 0 { 
        range[0].parse::<u64>()? 
    } else { 
        0 
    };
    let end = if range.len() > 1 {
        range[1].parse::<u64>()?
    } else {
        size-1 
    };
    Ok((start, end))
}