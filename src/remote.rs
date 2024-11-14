use serde::Deserialize;

use crate::{request_error::RequestError, webrequest::web_get};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRemoteFiles {
    //pub id: String,
    pub path: String,
    pub _show_hidden_items: bool,
}


pub fn get_remote_files(input: GetRemoteFiles) -> Result<(), RequestError> {
    let (_, path) = input.path.split_at(7);
    let sep = path.find("/").unwrap_or(path.len());
    let (ip, path) = path.split_at(sep);
    web_get(ip, format!("getfiles{}", path))?;
    Ok(())
}