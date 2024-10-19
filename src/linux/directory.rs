use std::fs::Metadata;

pub fn is_hidden(name: &str, _: &Metadata)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}
// TODO: str < 1 or 2?

pub trait MetaDataExt {
    fn filesize(&self) -> usize;
}

impl MetaDataExt for Metadata {
    fn filesize(&self) -> usize {
        self.len() as usize
    }
}
