use chrono::{DateTime, Utc};
use itertools::Itertools;
use lexicmp::natural_lexical_cmp;
use std::{fs::{read_dir, Metadata}, time::UNIX_EPOCH};

use napi::bindgen_prelude::*;
use napi_derive::napi;

use crate::error::AddonError;

#[derive(Clone)]
#[napi(object)]
pub struct FileItem {
	pub idx: i32,
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

fn get_internal_files(path: String, show_hidden: bool) -> std::result::Result<FileItemsResult, AddonError> {

    let read_dir = read_dir(&path)?;
    let (mut dirs, mut files): (Vec<_>, Vec<_>) = read_dir.filter_map(|entry|{
      	entry.ok().and_then(|entry| { 
      		match entry.metadata().ok() {
        		Some(metadata) => Some((entry, metadata)),
          		None => None
        	}
      	})
    })
    	.enumerate()
		.map(|(i, (entry, metadata))| {
	    	let name = entry.file_name().to_str().unwrap().to_string();
      		FileItem {
				idx: (i + 1) as i32,
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