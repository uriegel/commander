use std::{fs::Metadata, process::Command};

use super::iconresolver::get_geticon_py;

pub fn is_hidden(name: &str, _: &Metadata)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}

pub fn get_icon(path: &str)->String {
    let geticon_py = get_geticon_py();

    let output = Command::new("python")
        .arg(geticon_py)
        .arg(path)
        .output()
        .unwrap();
    String::from_utf8(output.stdout).unwrap().trim().to_string()
}

pub trait StringExt {
    fn clean_path(&self) -> String;
}

impl StringExt for String {
    fn clean_path(&self) -> String {
        self.clone()
    }
}
