use std::{fs::Metadata, os::windows::fs::MetadataExt};

pub fn is_hidden(_: &str, metadata: &Metadata)->bool {
    let attrs = metadata.file_attributes();
    attrs & 2 == 2
}
