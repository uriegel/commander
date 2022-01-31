use std::sync::Mutex;

use crate::engine::folder_engine::FolderEngine;

pub struct Folder {
    path: Option<String>,
    engine: Option<Box<dyn FolderEngine + Send + Sync>>,
}

impl Folder {
    pub fn new() -> Folder {
        Folder { path: None, engine: None }
    }

    pub fn change_path(&self, path: Option<String>, from_backlog: Option<bool>) {

    }

    pub fn set_path(&mut self, path: String) {
        self.path = Some(path);
    }

    pub fn get_path(&self) -> String {
        self.path.as_ref().unwrap_or(&"root".to_string()).clone()
    }
}

