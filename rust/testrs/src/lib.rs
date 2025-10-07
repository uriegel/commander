#![deny(clippy::all)]

use std::fs;

use napi_derive::napi;

#[napi]
pub fn plus_100(input: u32) -> u32 {
  get_files();
  input + 100
}


fn get_files() {
    let path = "/home/uwe".to_string();
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
              }
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

      Err(_) => {}
      //      Err(_) => env.create_array(0)
  }
}