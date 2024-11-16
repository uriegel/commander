use chrono::DateTime;
use serde::Deserialize;

use crate::{directory::{DirectoryItem, GetFilesResult}, request_error::RequestError, webrequest::web_get};

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
    let (_, path) = input.path.split_at(7);
    let sep = path.find("/").unwrap_or(path.len());
    let (ip, path) = path.split_at(sep);
    let payload = web_get(ip, format!("/getfiles{}", path))?;
    let items = serde_json::from_slice::<Vec<GetRemoteFilesResult>>(&payload)?;
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

// TODO: in Android Commander Engine: CopyFileToRemote: copy to remote file "copytoremote", then rename it to the correct filename
// TODO: Rename File
// TODO: Rename Directory
// TODO: Copy Directories from local to remote
// TODO: in Android Commander Engine: range for remote
