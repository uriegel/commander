use std::{ fs, time::UNIX_EPOCH };
use systemicons::init;
use systemicons::get_icon_as_file;
use neon::prelude::*;

fn init_gtk(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    init();
    Ok(cx.undefined())
}

fn get_icon(mut cx: FunctionContext) -> JsResult<JsString> {
    let ext = cx.argument::<JsString>(0)?.value(&mut cx);
    let size = cx.argument::<JsNumber>(1)?.value(&mut cx);

    let path = get_icon_as_file(&ext, size as i32).unwrap_or(String::from(""));
    Ok(cx.string(&path))
}

fn is_hidden(_: &str, name: &str)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}

// TODO async
pub fn get_files(mut cx: FunctionContext) -> JsResult<JsArray> {
    let path = cx.argument::<JsString>(0)?.value(&mut cx);
    let result: Handle<JsArray> = cx.empty_array();
    match fs::read_dir(&path) {
        Ok(entries) => {
            let files: Vec<_> = entries 
                .filter_map(|entry| { entry.ok().and_then(|entry| { 
                    match entry.metadata().ok() {
                        Some(metadata) => Some((entry, metadata)),
                        None => None
                    }
                })}).collect();
                for (entry, metadata) in &files {
                    let obj: Handle<JsObject> = cx.empty_object();
                    let namestr = String::from(entry.file_name().to_str().unwrap());
                    let hidden = cx.boolean(is_hidden(&path, &namestr));
                    let is_dir = cx.boolean(metadata.is_dir());
                    let name = cx.string(namestr);
                    let size = cx.number(metadata.len() as f64);
                    let date = cx.date(metadata.modified().unwrap().duration_since(UNIX_EPOCH).unwrap().as_millis() as f64);

                    obj.set(&mut cx, "name", name)?;
                    obj.set(&mut cx, "isHidden", hidden)?;
                    obj.set(&mut cx, "isDirectory", is_dir)?;
                    obj.set(&mut cx, "size", size)?;
                    if let Ok(date) = date {
                        obj.set(&mut cx, "date", date)?;
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
    cx.export_function("initGtk", init_gtk)?;
    cx.export_function("getIcon", get_icon)?;
    cx.export_function("getFiles", get_files)?;
    Ok(())
}