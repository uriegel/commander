use serde::Deserialize;

use crate::request_error::RequestError;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRemoteFiles {
    pub id: String,
    pub path: String,
    pub show_hidden_items: bool,
}


pub fn get_remote_files(input: GetRemoteFiles) -> Result<(), RequestError> {
    Ok(())
}