use std::net::TcpStream;

use crate::request_error::RequestError;

pub fn web_get(ip: &str, url: String) -> Result<(), RequestError> {
    let mut stream = TcpStream::connect(format!("{}:8080", ip))?; 
    Ok(())
}