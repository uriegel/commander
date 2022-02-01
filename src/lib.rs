#[macro_use]
extern crate napi_derive;

use napi::{Task, Env, Result, bindgen_prelude::{AsyncTask, Array}, JsUndefined};

// use chrono::{Local, NaiveDateTime, TimeZone};
// use exif::{In, Tag};
use lexical_sort::natural_lexical_cmp;
// use neon::prelude::*;
use std::{ fs, fs::File, io::BufReader, time::{UNIX_EPOCH, Duration}, thread };

#[cfg(target_os = "linux")]
use crate::linux::is_hidden;
#[cfg(target_os = "windows")]
use crate::windows::is_hidden;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "windows")]
mod windows;

#[napi]
pub fn get_files(env: Env, path: String) -> Result<Array> {
    match fs::read_dir(&path) {
        Ok(entries) => {
            let mut files: Vec<_> = entries 
            	.filter_map(|entry| { entry.ok().and_then(|entry| { 
                    match entry.metadata().ok() {
                        Some(metadata) => Some((entry, metadata)),
                        None => None
                    }
                })})
                .collect();

            files.sort_by(|(a, _), (b, _)| natural_lexical_cmp(a.file_name().to_str().unwrap(), &b.file_name().to_str().unwrap()));

			let mut res = env.create_array( files.len() as u32).unwrap();
			for (entry, metadata) in &files {
				let name = entry.file_name().to_str().unwrap().to_string();
				let is_hidden = is_hidden(&name, metadata);
				let is_directory = metadata.is_dir();
				let size = metadata.len() as f64;
				let time = metadata.modified().unwrap().duration_since(UNIX_EPOCH).unwrap().as_millis() as f64;
				let mut obj = env.create_object().unwrap();
  				obj.set("name", name).unwrap();
				obj.set("is_hidden", is_hidden).unwrap();
				obj.set("is_directory", is_directory).unwrap();
				obj.set("size", size).unwrap();
				obj.set("time", env.create_date(time)).unwrap();
				res.insert(obj).unwrap();
			}	
			Ok(res)
        },
        Err(_) => env.create_array(0)
	}
}


// pub fn get_exif_date(mut cx: FunctionContext) -> JsResult<JsUndefined> {

//     let path = cx.argument::<JsString>(0)?.value(&mut cx);
//     let callback = cx.argument::<JsFunction>(1)?.root(&mut cx);
//     let channel = cx.channel();

//     fn get_unix_time(str: &str)->i64 {
//         let naive_date_time = NaiveDateTime::parse_from_str(str, "%Y-%m-%d %H:%M:%S").unwrap();
//         let datetime = Local.from_local_datetime(&naive_date_time).unwrap();
//         datetime.timestamp_millis()
//     }    

//     rayon::spawn(move || {
//         let exifdate = File::open(path).ok().and_then(|file| {
//             let mut bufreader = BufReader::new(&file);        
//             let exifreader = exif::Reader::new();
//             exifreader.read_from_container(&mut bufreader).ok().and_then(|exif| {
//                 let exiftime = match exif.get_field(Tag::DateTimeOriginal, In::PRIMARY) {
//                     Some(info) => Some(info.display_value().to_string()),
//                     None => match exif.get_field(Tag::DateTime, In::PRIMARY) {
//                         Some(info) => Some(info.display_value().to_string()),
//                         None => None
//                     } 
//                 };
//                 match exiftime {
//                     Some(exiftime) => Some(get_unix_time(&exiftime)),
//                     None => None
//                 }            
//             })
//         });
//         channel.send(move |mut cx| {
//             let arg = match exifdate {
//                 Some(number) => cx.number(number as f64).upcast::<JsValue>(),
//                 None => cx.null().upcast()
//             };
//             let args = vec![ arg ];
//             let this = cx.undefined();
//             let callback = callback.into_inner(&mut cx);
//             callback.call(&mut cx, this, args)?;
//             Ok(())
//         });
//     });
//     Ok(cx.undefined())
// }

#[napi]
pub fn test() -> AsyncTask<Test> {
    AsyncTask::new(Test { })
}

pub struct Test {}

impl Task for Test {
	type Output = ();
  	type JsValue = JsUndefined;

  	fn compute(&mut self) -> Result<Self::Output> {
        thread::sleep(Duration::from_secs(5));
    	Ok(())
  	}

  	fn resolve(&mut self, env: Env, _: ()) -> Result<Self::JsValue> {
    	env.get_undefined()
  	}
}

