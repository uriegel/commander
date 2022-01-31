use std::any::{Any, TypeId};

use super::root_engine::{ROOT_PATH, RootEngine};

pub trait FolderEngine {
}

pub type FolderEngineType = Box<dyn FolderEngine + Send + Sync>;

pub fn check_engine(path: &str, recent: FolderEngineType) -> FolderEngineType {
    match path {
        ROOT_PATH if recent.type_id() == TypeId::of::<RootEngine>() => recent,
        ROOT_PATH => Box::new(RootEngine {}),
        _ => Box::new(RootEngine {})
    }
}
