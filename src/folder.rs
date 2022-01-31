use crate::engine::{folder_engine::{check_engine, FolderEngineType}, root_engine::{ROOT_PATH, RootEngine} };

pub struct Folder {
//    path: Option<String>,
    engine: Option<FolderEngineType>,
}

impl Folder {
    pub fn new() -> Folder {
        Folder { engine: Some(Box::new( RootEngine {} )) }
    }

    pub fn change_path(&mut self, path: Option<String>, from_backlog: Option<bool>) {
        let engine = check_engine(&path.unwrap_or_else(|| { ROOT_PATH.to_string()}), 
            self.engine.take().unwrap());
        self.engine = Some(engine);
    }

    // pub fn set_path(&mut self, path: String) {
    //     self.path = Some(path);
    // }

    // pub fn get_path(&self) -> String {
    //     self.path.as_ref().unwrap_or(&"root".to_string()).clone()
    // }
}

