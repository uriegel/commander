use std::{io::BufWriter, net::TcpStream};

pub struct Request<'a> {
    pub writer: BufWriter<&'a TcpStream>,
    pub request_line: &'a String,
    pub headers: &'a Vec<String>,
}