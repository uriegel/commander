use std::{fs::{self, Metadata}, process::Command};

use crate::error::Error;
use crate::directory::get_extension;

use super::iconresolver::get_geticon_py;

pub fn is_hidden(name: &str, _: &Metadata)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}

pub fn get_icon_path(name: &str, _path: &str)->Option<String> {
    get_extension(name).map(|e|e.to_string())
}

pub fn get_icon(path: &str)->Result<(String, Vec<u8>), Error> {
   
    fn run_cmd(path: &str)->Result<String, Error> {
        let geticon_py = get_geticon_py();
        let output = Command::new("python3")
            .arg(geticon_py)
            .arg(path)
            .output()
            ?.stdout;
        Ok(String::from_utf8(output)
            ?.trim()
            .to_string())
    }

    let icon_path = run_cmd(path)?;
    if icon_path.len() > 0 {
        icon_path.clone()
    } else {
        run_cmd("")?
    };
    let icon = fs::read(&icon_path)?;
    Ok((icon_path.clone(), icon))
}

pub fn get_version(input: &GetExtendedItems, item: &String) -> Option<Version> {
    None
}

pub trait StringExt {
    fn clean_path(&self) -> String;
}

impl StringExt for String {
    fn clean_path(&self) -> String {
        self.clone()
    }
}

