use std::{fs::{self, File}, io::{BufReader, BufWriter, ErrorKind}, path::PathBuf, sync::mpsc::Receiver, time::{SystemTime, UNIX_EPOCH}};

use chrono::DateTime;
use serde::Deserialize;
use urlencoding::encode;

use crate::{
    directory::{
        flatten_directories, CheckCoypItems, CopyItemResult, CopyItems, DirectoryItem, GetFilesResult
    }, progresses::CurrentProgress, progressstream::{
        ProgressReadStream, ProgressWriteStream
    }, request_error::RequestError, webrequest::WebRequest
};

#[cfg(target_os = "windows")]
use crate::windows::directory::{ConflictItem, update_directory_item};
#[cfg(target_os = "linux")]
use crate::linux::directory::{update_directory_item, ConflictItem};

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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteItems {
    pub path: String,
    pub names: Vec<String>
}

pub fn get_remote_files(input: GetRemoteFiles) -> Result<GetFilesResult, RequestError> {
    let path_and_ip = get_remote_path(&input.path);
    let items = 
        WebRequest::get(path_and_ip.ip, format!("/getfiles{}", encode(&path_and_ip.path)))
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

pub fn check_copy_items_to_remote(input: CheckCoypItems)->Result<CopyItemResult, RequestError> {
    let conflict_items = 
        flatten_directories(&input.path, input.items)?
            .into_iter()
            .map(|di|create_copy_item(di, &input.path, &input.target_path))
            .collect::<Result<Vec<_>, RequestError>>()?;
    let (items, conflicts): (Vec<Option<DirectoryItem>>, Vec<Option<ConflictItem>>) = conflict_items.into_iter().unzip();
    let items: Vec<DirectoryItem> = items.into_iter().filter_map(|f|f).collect();
    let conflicts: Vec<ConflictItem> = conflicts.into_iter().filter_map(|f|f).collect();
    Ok(CopyItemResult { items, conflicts })
}

pub fn copy_from_remote(input: &CopyItems, file: &str, progress: &CurrentProgress, rcv: &Receiver<bool>)->Result<(), RequestError> {
    let path_and_ip = get_remote_path(&input.path);
    let source_file = PathBuf::from(&path_and_ip.path).join(file);
    let target_file = PathBuf::from(&input.target_path).join(file);
    let file = File::create(target_file)?;
    let source_path = source_file.to_string_lossy();
    #[cfg(target_os = "windows")]
    let source_path = source_path.replace("\\", "/");
    let mut web_request = WebRequest::get(path_and_ip.ip, format!("/downloadfile{}", encode(&source_path)))?;
    let mut progress_stream = ProgressWriteStream::new(BufWriter::new(&file), 
        |p| progress.send_bytes(p as u64));
    web_request.download(&mut progress_stream, rcv)?;
    progress_stream.flush()?;
    web_request
        .get_header("x-file-date")
        .and_then(|x|x.parse::<i64>().ok())
        .and_then(|x|DateTime::from_timestamp_millis(x)) 
        .map(|dt|SystemTime::from(dt))
        .inspect(|st|{ let _ = file.set_modified(*st); });
    Ok(())
}

pub fn copy_to_remote(input: &CopyItems, file: &str, progress: &CurrentProgress, rcv: &Receiver<bool>)->Result<(), RequestError> {
    let path_and_ip = get_remote_path(&input.target_path);
    let target_file = PathBuf::from(&path_and_ip.path).join(file);
    let source_file = PathBuf::from(&input.path).join(file);
    let file = File::open(source_file)?;
    let target_path = target_file.to_string_lossy();
    #[cfg(target_os = "windows")]
    let target_path = target_path.replace("\\", "/");
    let meta = file.metadata()?;
    let datetime = 
        meta
            .modified()
            .ok()
            .and_then(|t|t.duration_since(UNIX_EPOCH).ok())
            .map(|d|d.as_millis() as i64); 
    let mut progress_stream = ProgressReadStream::new(BufReader::new(&file),         
        |p| progress.send_bytes(p as u64));
    WebRequest::put(path_and_ip.ip, format!("/putfile{}", encode(&target_path)), &mut progress_stream, meta.len() as usize, datetime, rcv)?;
    Ok(())
}

pub fn delete_remote_files(input: DeleteItems)->Result<(), RequestError> {
    input.names.iter().try_for_each(|i|{
        let target_file = PathBuf::from(&input.path).join(i);
        let target_file = target_file.to_string_lossy();
        let path_and_ip = get_remote_path(&target_file);    
        WebRequest::delete(path_and_ip.ip, format!("/deletefile{}", encode(&path_and_ip.path)))?;
        Ok(())
    })
}

fn create_copy_item(item: DirectoryItem, path: &str, target_path: &str)->Result<(Option<DirectoryItem>, Option<ConflictItem>), RequestError> { 
    let updated_item = match fs::metadata(PathBuf::from(path).join(&item.name)) {
        Ok (meta) => Ok(Some(update_directory_item(item.copy(), &meta))),
        Err (err) if err.kind() == ErrorKind::NotFound => Ok(None),
        Err (err) => Err(err)
    }?;

    let target_file = PathBuf::from(target_path).join(&item.name);
    let target_file = target_file.to_string_lossy();
    #[cfg(target_os = "windows")]
    let target_file = target_file.replace("\\", "/");

    let path_and_ip = get_remote_path(&target_file);
    let RemoteMetaData { size, time} = 
        WebRequest::get(path_and_ip.ip, format!("/metadata{}", encode(&path_and_ip.path)))
            ?.to::<RemoteMetaData>()?;

    let conflict = updated_item.as_ref().and_then(|n| {
        match size {
            -1 => None,
            _ => Some(ConflictItem::from_values(&n, size as u64, time)),
        }
    });

    Ok((updated_item, conflict))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RemoteMetaData {
    size: i64, 
    time: i64 
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

// TODO: Rename File
// TODO: Rename Directory
// TODO: in Android Commander Engine: CopyFileToRemote: copy to remote file "copytoremote", then rename it to the correct filename
// TODO: Copy Directories from local to remote
// TODO: in Android Commander Engine: range for remote
