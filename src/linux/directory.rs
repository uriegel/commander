use std::{fs::{self, metadata, Metadata}, path::PathBuf, process::Command};

use gtk::gio::{prelude::*, Cancellable, FileCopyFlags};
use gtk::gio::File;

use crate::{directory::CopyItems, error::Error, extended_items::{GetExtendedItems, Version}, progresses::{ProgressControl, ProgressFiles}, request_error::RequestError, str::StrExt};
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

pub fn copy_items(input: CopyItems)->Result<(), RequestError> {
    let items: Vec<(&String, u64)> = input.items.iter().map(|item|
        (item, metadata(PathBuf::from(&input.path).join(&item))
            .ok()
            .map(|m| m.len())
            .unwrap_or_default()))
            .collect();
    
    let progress_control = ProgressControl::new(
        items.iter().fold(0u64, |curr, (_, i)|i + curr), 
        input.items.len() as u32);

    items.iter().try_fold(ProgressFiles::default(), |curr, (file, file_size)| {
        let progress_files = curr.get_next(file, *file_size);
        progress_control.send_file(progress_files.file, progress_files.get_current_bytes(), progress_files.index);

        let source_file = PathBuf::from(&input.path).join(&file);
        let target_file = PathBuf::from(&input.target_path).join(&file);
        if !input.move_ {
            File::for_path(source_file).copy(&File::for_path(target_file), FileCopyFlags::OVERWRITE, 
                None::<&Cancellable>, Some(&mut move |s, t|
                    progress_control.send_progress(s as u64, t as u64, progress_files.get_current_bytes())
            ))?;
        } else {
            File::for_path(source_file).move_(&File::for_path(target_file), FileCopyFlags::OVERWRITE, 
                None::<&Cancellable>, Some(&mut move |s, t|
                    progress_control.send_progress(s as u64, t as u64, progress_files.get_current_bytes())
            ))?;
        }
        // TODO Dropper for progress, show error
        Ok::<_, RequestError>(progress_files)
    })?;
    Ok(())
}

// TODO Progress total size
// TODO Progress times
// TODO Progress Windows
// TODO Error handling
// TODO lock copy operation (on UI)
// TODO cancel copy operation
// TODO can close: Ok cancel

pub trait StringExt {
    fn clean_path(&self) -> String;
}

impl StringExt for String {
    fn clean_path(&self) -> String {
        self.clone()
    }
}

