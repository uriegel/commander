use std::iter::once;

pub mod root;
pub mod directory;
pub mod version;
mod error;
mod request_error;
mod progresses;

pub fn string_to_pcwstr(x: &str) -> Vec<u16> {
    x.encode_utf16().chain(once(0)).collect()
}

pub fn string_from_pcwstr(pwcstr: &[u16]) -> String {
    let pstr: Vec<u16> = 
        pwcstr
            .iter()
            .take_while(|&&i|i != 0)
            .cloned()
            .collect();
    String::from_utf16_lossy(&pstr)
}


