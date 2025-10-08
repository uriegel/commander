#![deny(clippy::all)]

use std::{fs::read_dir, io, time::UNIX_EPOCH};

use napi::bindgen_prelude::*;
use napi_derive::napi;

 #[derive(Clone)]
#[napi(object)]
pub struct FileItem {
  pub name: String,
  pub is_hidden: bool,
  pub is_directory: bool,
  pub size: i64,
  pub time: i64,
}

pub enum MyError {
    NapiError(Error<Status>),
    IOError((i32, String)),
    GeneralError((i32, String))
}

impl AsRef<str> for MyError {
  fn as_ref(&self) -> &str {
    match self {
      MyError::IOError((_, str)) => str,
      MyError::GeneralError((_, str)) => str,
      MyError::NapiError(e) => e.status.as_ref(),
    }
  }
}

impl From<io::Error> for MyError {
    fn from(_err: io::Error) -> Self {
        MyError::IOError((5, "Zugriff verweigert".to_string()))
    }
}

impl From<MyError> for Error {
    fn from(err: MyError) -> Error {
        match err {
            MyError::NapiError(e) => e,
            MyError::IOError((code,str)) => Error::new(Status::InvalidArg, format!("{}-{}", code, str)),
            MyError::GeneralError((code,str)) => Error::new(Status::InvalidArg, format!("{}-{}", code, str))
        }    
    }
}

pub struct AsyncGetFiles {
  path: String,
}


#[napi]
impl Task for AsyncGetFiles {
  type Output = Vec<FileItem>;
  type JsValue = Vec<FileItem>;
 
  fn compute(&mut self) -> Result<Self::Output> {
    get_internal_files(self.path.clone())
      .map_err(|e| { e.into() })
  }
 
  fn resolve(&mut self, _: Env, output: Self::Output) -> Result<Self::JsValue> {
    Ok(output)
  }
}
 
#[napi]
pub fn get_files_async(path: String) -> AsyncTask<AsyncGetFiles> {
  AsyncTask::new(AsyncGetFiles { path })
} 

fn get_internal_files(path: String) -> std::result::Result<Vec<FileItem>, MyError> {

    let read_dir = read_dir(&path)?;
    let entries: Vec<_> = read_dir.filter_map(|entry|{
      entry.ok().and_then(|entry| { 
        match entry.metadata().ok() {
          Some(metadata) => Some((entry, metadata)),
          None => None
        }
      })
    }).map(|(entry, metadata)| {
      let name = entry.file_name().to_str().unwrap().to_string();
      FileItem {
        is_directory: metadata.is_dir(),
        is_hidden: is_hidden(&name),
        size: metadata.len() as i64,
        name,
        time: metadata.modified().unwrap().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64
      }
    }).collect();
    Ok(entries)


            //files.sort_by(|(a, _), (b, _)| natural_lexical_cmp(a.file_name().to_str().unwrap(), &b.file_name().to_str().unwrap()));

			// let mut res = env.create_array( files.len() as u32).unwrap();
			// for (entry, metadata) in &files {
			// 	let name = entry.file_name().to_str().unwrap().to_string();
			// 	let is_hidden = is_hidden(&name, metadata);
			// 	let is_directory = metadata.is_dir();
			// 	let size = metadata.len() as f64;
			// 	let time = metadata.modified().unwrap().duration_since(UNIX_EPOCH).unwrap().as_millis() as f64;
			// 	let mut obj = env.create_object().unwrap();
  		// 		obj.set("name", name).unwrap();
			// 	obj.set("is_hidden", is_hidden).unwrap();
			// 	obj.set("is_directory", is_directory).unwrap();
			// 	obj.set("size", size).unwrap();
			// 	obj.set("time", env.create_date(time)).unwrap();
			// 	res.insert(obj).unwrap();
			// }	
//			Ok(res)

}

fn is_hidden(name: &str)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}
