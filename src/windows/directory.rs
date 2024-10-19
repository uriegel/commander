use std::{fs::Metadata, os::windows::fs::MetadataExt};

pub fn is_hidden(_: &str, metadata: &Metadata)->bool {
    let attrs = metadata.file_attributes();
    attrs & 2 == 2
}

pub trait StringExt {
    fn clean_path(&self) -> String;
}

impl StringExt for String {
    fn clean_path(&self) -> String {
        if self.starts_with("\\\\?\\") {
            self[4..].to_string()
        } else {
            self.clone()
        }
    }
}
