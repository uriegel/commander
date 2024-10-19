use std::{fs::Metadata, os::windows::fs::MetadataExt};

pub fn is_hidden(_: &str, metadata: &Metadata)->bool {
    let attrs = metadata.file_attributes();
    attrs & 2 == 2
}

pub trait MetaDataExt {
    fn filesize(&self) -> usize;
}

impl MetaDataExt for Metadata {
    fn filesize(&self) -> usize {
        self.len() as usize
    }
}
