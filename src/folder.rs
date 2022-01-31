pub struct Folder {
    path: Option<String>
}

impl Folder {
    pub const fn new() -> Folder {
        Folder { path: None }
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

