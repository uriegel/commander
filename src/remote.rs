use serde::Deserialize;

use crate::{directory::{DirectoryItem, GetFilesResult}, request_error::RequestError, webrequest::web_get};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRemoteFiles {
    //pub id: String,
    pub path: String,
    pub _show_hidden_items: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRemoteFilesResult {
    name: String,
    is_directory: bool,
    size: u64,  is_hidden: bool,
    time: u64
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
                time: None, // TODO n.time,
                icon_path: if n.is_directory { None} else { Some(n.name) }
            }
        })     
        .collect();

        // TODO is hidden filtering
        // TODO count files dirs
        // TODO DCIM Camera => error, eprintln in Error mapper



    Ok(GetFilesResult {
        items,
        path: input.path,
        dir_count: 0,
        file_count: 0
    })
}
