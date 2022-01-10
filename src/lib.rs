use lexical_sort::natural_lexical_cmp;
use neon::prelude::*;
use std::{ fs, time::UNIX_EPOCH };

#[cfg(target_os = "linux")]
use crate::linux::is_hidden;
#[cfg(target_os = "windows")]
use crate::windows::is_hidden;

#[cfg(target_os = "linux")]
use crate::linux::init_addon;
#[cfg(target_os = "windows")]
use crate::windows::init_addon;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "windows")]
mod windows;

// TODO Trait std::os::windows::fs::MetadataExt
pub fn get_files(mut cx: FunctionContext) -> JsResult<JsArray> {
    let path = cx.argument::<JsString>(0)?.value(&mut cx);
    let result: Handle<JsArray> = cx.empty_array();
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
                
            for (entry, metadata) in &files {
                let obj: Handle<JsObject> = cx.empty_object();
                let namestr = String::from(entry.file_name().to_str().unwrap());
                let hidden = cx.boolean(is_hidden(&namestr));
                let is_dir = cx.boolean(metadata.is_dir());
                let name = cx.string(namestr);
                let size = cx.number(metadata.len() as f64);
                let time = cx.date(metadata.modified().unwrap().duration_since(UNIX_EPOCH).unwrap().as_millis() as f64);

                obj.set(&mut cx, "name", name)?;
                obj.set(&mut cx, "isHidden", hidden)?;
                obj.set(&mut cx, "isDirectory", is_dir)?;
                obj.set(&mut cx, "size", size)?;
                if let Ok(time) = time {
                    obj.set(&mut cx, "time", time)?;
                }
                let len = result.len(&mut cx);                    
                result.set(&mut cx, len, obj)?;
            }
        },
        Err(_err) => {}
    }
    Ok(result)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getFiles", get_files)?;
    init_addon(cx)?;
    Ok(())
}