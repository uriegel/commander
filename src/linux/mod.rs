use gio::{File, FileCopyFlags, { prelude::FileExt} };
use std::fs::Metadata;
use systemicons::init;
use systemicons::get_icon_as_file;
use neon::prelude::*;

pub fn is_hidden(name: &str, _: &Metadata)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}

pub fn init_addon(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("initGtk", init_gtk)?;
    cx.export_function("getIcon", get_icon)?;
    cx.export_function("copyFile", copy_file)?;
    Ok(())
}

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

fn copy_file(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let file = File::for_path("/home/uwe/Videos/raw/Goldeneye.mts");
    let target = File::for_path("/home/uwe/test/affe.mts");

    let mut affe = |a, b |{
        println!("Progess: {}, {}", a, b);
    };

    let res = file.copy(&target, FileCopyFlags::OVERWRITE | FileCopyFlags::ALL_METADATA, Some(&gio::Cancellable::new()), 
        Some(&mut affe));
    Ok(cx.undefined())
}
