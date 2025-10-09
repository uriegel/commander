#![deny(clippy::all)]

use std::{fs::{read_dir, Metadata}, io, time::UNIX_EPOCH};
use chrono::{DateTime, Utc};

use itertools::Itertools;
use lexicmp::natural_lexical_cmp;
use napi::bindgen_prelude::*;
use napi_derive::napi;

#[derive(Clone)]
#[napi(object)]
pub struct FileItem {
	pub name: String,
	pub is_hidden: bool,
	pub is_directory: bool,
	pub size: i64,
	pub time: String,
}

#[napi(object)]
pub struct FileItemsResult {
	pub items: Vec<FileItem>,
	pub dir_count: i32,
	pub file_count: i32,
	pub path: String
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
	is_hidden: bool
}


#[napi]
impl Task for AsyncGetFiles {
	type Output = FileItemsResult;
	type JsValue = FileItemsResult;
 
	fn compute(&mut self) -> Result<Self::Output> {
		get_internal_files(self.path.clone(), self.is_hidden)
			.map_err(|e| { e.into() })
	}
 
  	fn resolve(&mut self, _: Env, output: Self::Output) -> Result<Self::JsValue> {
		Ok(output)
  	}
}
 
#[napi]
pub fn get_files_async(path: String, is_hidden: bool) -> AsyncTask<AsyncGetFiles> {
	AsyncTask::new(AsyncGetFiles { path, is_hidden })
} 

fn get_internal_files(path: String, show_hidden: bool) -> std::result::Result<FileItemsResult, MyError> {

    let read_dir = read_dir(&path)?;
    let (mut dirs, mut files): (Vec<_>, Vec<_>) = read_dir.filter_map(|entry|{
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
        		time: get_datetime(metadata)
      		}
    	})
		.filter(|item| {
			show_hidden || !item.is_hidden
		})
		.partition_map(|item|{
			if item.is_directory {
				itertools::Either::Left(item)
			} else {
				itertools::Either::Right(item)
			}
		});

	dirs.sort_by(|a, b| natural_lexical_cmp(&a.name, &b.name));	
	files.sort_by(|a, b| natural_lexical_cmp(&a.name, &b.name));	
	let file_count = files.len() as i32;
	let dir_count = dirs.len() as i32;
	dirs.append(&mut files);

    Ok(FileItemsResult {
		items: dirs,
		dir_count,
		file_count,
		path
	})

    
}

fn is_hidden(name: &str)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}

fn get_datetime(metadata: Metadata) -> String {
	let duration = metadata.modified().unwrap().duration_since(UNIX_EPOCH).unwrap();
	let datetime: DateTime<Utc> = DateTime::<Utc>::from(UNIX_EPOCH + duration);

    // Format as ISO 8601 with milliseconds and Z
    datetime.to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}