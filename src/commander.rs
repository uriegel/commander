use std::{sync::Mutex};

use crate::{folder::Folder, error::StringError};

use lazy_static::lazy_static;
use napi::{Task, bindgen_prelude::AsyncTask, JsUndefined, Env};

#[napi]
pub fn change_path(inst: u32, path: Option<String>, from_backlog: Option<bool>) -> AsyncTask<AsyncChangePath> {
    let mut commander = COMMANDER.lock().unwrap();
    let mut folder = commander.get_mut_folder(FolderInst::from_arg(inst)?);
    folder.change_path(path.clone(), from_backlog);

    AsyncTask::new(AsyncChangePath { inst, path, from_backlog })
}

pub struct AsyncChangePath {
	inst: u32, 
    path: Option<String>, 
    from_backlog: Option<bool>
}

impl Task for AsyncChangePath {
	type Output = ();
  	type JsValue = JsUndefined;

  	fn compute(&mut self) -> napi::Result<Self::Output> {
        // // TODO in uv thread
        
        // // TODO run all from folder.js changePath
        Ok(())
  	}

  	fn resolve(&mut self, env: Env, _: ()) -> napi::Result<Self::JsValue> {
    	env.get_undefined()
  	}
}


struct Commander{
    folder_left: Folder,
    folder_right: Folder,
}

impl Commander {
    fn new() -> Commander {
        Commander { 
            folder_left: Folder::new(), 
            folder_right: Folder::new() 
        }
    }

    fn get_folder(&self, inst: FolderInst) -> &Folder {
        match inst {
            FolderInst::LEFT => &self.folder_left,
            FolderInst::RIGHT => &self.folder_right,
        }
    }

    fn get_mut_folder(&mut self, inst: FolderInst) -> &mut Folder {
        match inst {
            FolderInst::LEFT => &mut self.folder_left,
            FolderInst::RIGHT => &mut self.folder_right,
        }
    }
}

enum FolderInst {
    LEFT = 1,
    RIGHT = 2,
}

impl FolderInst {
    fn from_arg(index: u32) -> Result<FolderInst, StringError> {
        match index {
            1 => Ok(FolderInst::LEFT),
            2 => Ok(FolderInst::RIGHT),
            _ => Err(StringError{ message: "Falscher Wert".to_string() })
        }
    }
}

lazy_static! {
    static ref COMMANDER: Mutex<Commander> = Mutex::new(Commander::new());
}