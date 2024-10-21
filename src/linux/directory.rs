use std::fs::Metadata;

pub fn is_hidden(name: &str, _: &Metadata)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}
// TODO: str < 1 or 2?

pub fn get_icon(path: &str)->String {
    let a = path;
    let s = a;
    "nix".to_string()
}

pub trait StringExt {
    fn clean_path(&self) -> String;
}

impl StringExt for String {
    fn clean_path(&self) -> String {
        self.clone()
    }
}
