pub mod root;
pub mod directory;

pub fn string_to_pcwstr(x: &str) -> Vec<u16> {
    x.encode_utf16().chain(std::iter::once(0)).collect()
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


