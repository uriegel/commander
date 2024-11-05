use std::{fs::{self, Metadata}, path::PathBuf, process::Command};

use gtk::gio::{prelude::*, Cancellable, FileCopyFlags};
use gtk::gio::File;

use crate::{directory::CopyItems, error::Error, extended_items::{GetExtendedItems, Version}, request_error::RequestError, str::StrExt};
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

pub fn get_version(_: &GetExtendedItems, _: &String) -> Option<Version> {
    None
}

pub fn mount(path: &str)->String {
    Command::new("udisksctl")
        .arg("mount")
        .arg("-b")
        .arg(format!("/dev/{path}"))
        .output()
        .inspect_err(|e|println!("Could not mount: {e}"))
        .ok()
        .and_then(|output|String::from_utf8(output.stdout).ok())
        .as_deref()
        .and_then(|output| output.substr_after(" at "))
        .map(|s|s.trim())
        .unwrap_or(path)
        .to_string()
}

// TODO Windows version
// TODO correct options
// TODO Progress Linux
// TODO Progress Windows
// TODO Error handling
// TODO lock copy operation (on UI)
// TODO cancel copy operation
// TODO can close: Ok cancel
pub fn copy_items(input: CopyItems)->Result<(), RequestError> {
    for item in input.items {
        let source_file = File::for_path(PathBuf::from(&input.path).join(&item));
        let target_file = File::for_path(PathBuf::from(&input.target_path).join(&item));
        if input.move_ {
            source_file.move_(&target_file, FileCopyFlags::OVERWRITE, None::<&Cancellable>, Some(&mut |s, t| {
                println!("Progress {}, {}", s, t);
            }))?;
        } else {
            source_file.copy(&target_file, FileCopyFlags::OVERWRITE, None::<&Cancellable>, Some(&mut |s, t| {
                println!("Progress {}, {}", s, t);
            }))?;
        }
    }
    Ok(())
}


pub trait StringExt {
    fn clean_path(&self) -> String;
}

impl StringExt for String {
    fn clean_path(&self) -> String {
        self.clone()
    }
}

