use chrono::{Local, NaiveDateTime, TimeZone};
use exif::{In, Tag};
use lexical_sort::natural_lexical_cmp;
use neon::prelude::*;
use std::{ fs, fs::File, io::BufReader, time::UNIX_EPOCH };

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
                let hidden = cx.boolean(is_hidden(&namestr, &metadata));
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

pub fn get_exif_date(mut cx: FunctionContext) -> JsResult<JsPromise> {

    let path = cx.argument::<JsString>(0)?.value(&mut cx);

    fn get_unix_time(str: &str)->i64 {
        let naive_date_time = NaiveDateTime::parse_from_str(str, "%Y-%m-%d %H:%M:%S").unwrap();
        let datetime = Local.from_local_datetime(&naive_date_time).unwrap();
        datetime.timestamp_millis()
    }    

    let promise = cx
        // Finish the stream on the Node worker pool
        .task(move || {
            let exifdate = File::open(path).ok().and_then(|file| {
                let mut bufreader = BufReader::new(&file);        
                let exifreader = exif::Reader::new();
                exifreader.read_from_container(&mut bufreader).ok().and_then(|exif| {
                    let exiftime = match exif.get_field(Tag::DateTimeOriginal, In::PRIMARY) {
                        Some(info) => Some(info.display_value().to_string()),
                        None => match exif.get_field(Tag::DateTime, In::PRIMARY) {
                            Some(info) => Some(info.display_value().to_string()),
                            None => None
                        } 
                    };
                    match exiftime {
                        Some(exiftime) => Some(get_unix_time(&exiftime)),
                        None => None
                    }            
                })
            });
            Ok(exifdate)
        })
        // Convert the remaining output into an `ArrayBuffer` and resolve the promise
        // on the JavaScript main thread.
        .promise(|mut cx, res: Result<Option<i64>, String>| {
            let exifdate = res.unwrap();
            let res = match exifdate {
                Some(number) => cx.number(number as f64).upcast::<JsValue>(),
                None => cx.null().upcast()
            };
            Ok(res)
        });

    Ok(promise)    

    // rayon::spawn(move || {
    //     channel.send(move |mut cx| {
    //         let args = vec![ arg ];
    //         let this = cx.undefined();
    //         let callback = callback.into_inner(&mut cx);
    //         callback.call(&mut cx, this, args)?;
    //         Ok(())
    //     });
    // });
    // Ok(cx.undefined())
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getFiles", get_files)?;
    cx.export_function("getExifDate", get_exif_date)?;
    init_addon(cx)?;
    Ok(())
}