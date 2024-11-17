use std::{fs::File, io::BufWriter, path::PathBuf};

use chrono::DateTime;
use serde::Deserialize;

use crate::{directory::{
    CopyItems, DirectoryItem, GetFilesResult}, progresses::ProgressFiles, request_error::RequestError, webrequest::WebRequest
};

use super::progresses::ProgressControl;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRemoteFiles {
    pub path: String,
    pub show_hidden_items: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRemoteFilesResult {
    name: String,
    is_directory: bool,
    size: u64,  is_hidden: bool,
    time: i64
}

pub fn get_remote_files(input: GetRemoteFiles) -> Result<GetFilesResult, RequestError> {
    let path_and_ip = get_remote_path(&input.path);
    let items = 
        WebRequest::get(path_and_ip.ip, format!("/getfiles{}", path_and_ip.path))
        ?.to::<Vec<GetRemoteFilesResult>>()?;
    let items: Vec<DirectoryItem> = items
        .into_iter()
        .map(|n|{
            DirectoryItem {
                name: n.name.clone(),
                is_directory: n.is_directory,
                is_hidden: n.is_hidden,
                size: n.size,
                time: if n.time != 0 { Some(DateTime::from_timestamp_nanos(n.time * 1_000_000)) } else { None },
                icon_path: if n.is_directory { None} else { Some(n.name) }
            }
        })     
        .filter(|n| input.show_hidden_items || !n.is_hidden)
        .collect();

    let dir_count = items.iter().filter(|n|n.is_directory).count();
    let file_count = items.iter().filter(|n|!n.is_directory).count();
    Ok(GetFilesResult {
        items,
        path: input.path,
        dir_count,
        file_count,
    })
}

pub fn copy_from_remote(mov: bool, input: &CopyItems, file: &str, mut progress_control: ProgressControl, progress_files: ProgressFiles)->Result<(), RequestError> {
    let path_and_ip = get_remote_path(&input.path);
    let source_file = PathBuf::from(path_and_ip.path).join(file);
   // let payload = web_get(path_and_ip.ip, format!("/getfiles{}", path_and_ip.path))?;
    let target_file = PathBuf::from(&input.target_path).join(file);
    
    let file = File::create(target_file)?;
    let file_writer = BufWriter::new(file);


    // TODO download file: read content length
    // TODO copy from remote to loacl via bufreader
    // TODO adapt wrapper for bufreader: progress
    // TODO copy file attributes from remote
    // TODO reset_copy_cancellable();, use this??? or another cancel mechanism
//    if !mov {
        // // File::for_path(source_file).copy(&File::for_path(target_file), FileCopyFlags::OVERWRITE, 
        // // get_copy_cancellable().as_ref(), Some(&mut move |s, t| 
        // //         progress_control.send_progress(s as u64, t as u64, progress_files.get_current_bytes())
//        ))?;
//    } else {
//        File::for_path(source_file).move_(&File::for_path(target_file), FileCopyFlags::OVERWRITE, 
//        get_copy_cancellable().as_ref(), Some(&mut move |s, t| 
//                progress_control.send_progress(s as u64, t as u64, progress_files.get_current_bytes())
//        ))?;
//    }
    Ok(())
}

struct PathAndIp<'a> {
    ip: &'a str,
    path: &'a str,
}

fn get_remote_path<'a>(path: &'a str)-> PathAndIp<'a> {
    let (_, path) = path.split_at(7);
    let sep = path.find("/").unwrap_or(path.len());
    let (ip, path) = path.split_at(sep);
    PathAndIp { ip, path }
}


// TODO: in Android Commander Engine: CopyFileToRemote: copy to remote file "copytoremote", then rename it to the correct filename
// TODO: Rename File
// TODO: Rename Directory
// TODO: Copy Directories from local to remote
// TODO: in Android Commander Engine: range for remote
