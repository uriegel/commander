use gio::{File, FileCopyFlags, { prelude::FileExt} };
use std::fs::Metadata;
use systemicons::init;
use systemicons::get_icon_as_file;
use neon::prelude::*;

use std::sync::atomic::{AtomicUsize, Ordering};

trait Tr {
    fn get_counter() -> &'static AtomicUsize {
        static COUNTER: AtomicUsize = AtomicUsize::new(0);
        &COUNTER
    }
}

struct CopyStatus { }

impl<CopyStatus> Tr for CopyStatus { }

impl CopyStatus {
    fn get_value() -> usize {
        let counter = CopyStatus::get_counter();
        counter.fetch_add(0, Ordering::Relaxed)
    }
    fn add_value(val: usize) {
        let counter = CopyStatus::get_counter();
        counter.fetch_add(val, Ordering::Relaxed);
    }
}

pub fn is_hidden(name: &str, _: &Metadata)->bool {
    name.as_bytes()[0] == b'.' && name.as_bytes()[1] != b'.'
}

pub fn init_addon(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("initGtk", init_gtk)?;
    cx.export_function("getIcon", get_icon)?;
    cx.export_function("copyFile", copy_file)?;
    cx.export_function("getCopyStatus", get_copy_status)?;
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

    let callback = cx.argument::<JsFunction>(0)?.root(&mut cx);
    let channel = cx.channel();
    
    std::thread::spawn(move || {
        let mut affe = |a, b |{
            CopyStatus::add_value(a as usize);
            // let affe = CopyStatus::get_value();
            // println!("Progess: {}, {} {}", a, b, affe);
        };

        let res = file.copy(&target, FileCopyFlags::OVERWRITE | FileCopyFlags::ALL_METADATA, Some(&gio::Cancellable::new()), 
            Some(&mut affe));
        channel.send(move |mut cx| {
            let this = cx.undefined();
            let callback = callback.into_inner(&mut cx);
            let args = vec![ cx.null().upcast::<JsValue>() ];
            callback.call(&mut cx, this, args)?;
            Ok(())
        });
    });
    Ok(cx.undefined())
}

fn get_copy_status(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let affe = CopyStatus::get_value();
    Ok(cx.number(affe as f64))
}
