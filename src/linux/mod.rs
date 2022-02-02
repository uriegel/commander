use core::fmt;
use gio::{File, FileCopyFlags, { prelude::FileExt} };
use std::fs::Metadata;
use systemicons::init;
use systemicons::get_icon_as_file;
use neon::prelude::*;

use std::sync::atomic::{AtomicUsize, Ordering};

use crate::{FileError, FileErrorType};

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
        counter.load(Ordering::Relaxed)
    }
    fn add_value(val: usize) {
        let counter = CopyStatus::get_counter();
        counter.store(val, Ordering::Relaxed);
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
    cx.export_function("trashFile", trash_file)?;
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

impl fmt::Display for FileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({})", self.description)
    }
}

impl From<glib::Error> for FileError {
    fn from(error: glib::Error) -> Self {
        FileError { 
            description: error.to_string(), 
            code: match unsafe { (*error.into_raw()).code } {
                    1  => FileErrorType::FileNotFound,
                    2  => FileErrorType::FileExists,
                    14 => FileErrorType::AccessDenied,
                    _  => FileErrorType::Unknown
                }                
        } 
    }
}

fn copy_file(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    // let file_path = cx.argument::<JsString>(0)?.value(&mut cx);
    // let target_path = cx.argument::<JsString>(1)?.value(&mut cx);
    // let move_file = if cx.len() > 3 {
    //     cx.argument::<JsBoolean>(3)?.value(&mut cx)
    // } else {
    //     false
    // };
    // let overwrite = if cx.len() > 4 {
    //     cx.argument::<JsBoolean>(4)?.value(&mut cx)
    // } else {
    //     false
    // };
        
    // let file = File::for_path(file_path);
    // let target = File::for_path(target_path);

    // let callback = cx.argument::<JsFunction>(2)?.root(&mut cx);
    // let channel = cx.channel();
    
    // rayon::spawn(move || {
    //     let mut cb = |a, _b |{
    //         CopyStatus::add_value(a as usize);
    //     };

    //     let res = if move_file {
    //         file.move_(&target, 
    //             if overwrite { FileCopyFlags::OVERWRITE } else { FileCopyFlags::NONE }, 
    //             Some(&gio::Cancellable::new()), 
    //             Some(&mut cb))
    //     } else {
    //         file.copy(&target, 
    //             if overwrite { FileCopyFlags::OVERWRITE } else { FileCopyFlags::NONE }, 
    //             Some(&gio::Cancellable::new()), 
    //             Some(&mut cb))
    //     };
    //     let error = if let Err(error) = res {
    //         Some(FileError { description: error.to_string(), code: unsafe { (*error.into_raw()).code } } )
    //     } else { None };

    //     let original_error = error.clone();

    //     let create_dir = match error {
    //         Some(e) => e.code == 1 && file.query_exists(Some(&gio::Cancellable::new())),
    //         None => false
    //     };

    //     let error = if create_dir {
    //         let parent = target.parent().unwrap();
    //         let _res = parent.make_directory_with_parents(Some(&gio::Cancellable::new()));

    //         let res = if move_file {
    //             file.move_(&target, 
    //                 if overwrite { FileCopyFlags::OVERWRITE } else { FileCopyFlags::NONE }, 
    //                 Some(&gio::Cancellable::new()), 
    //                 Some(&mut cb))
    //         } else {
    //             file.copy(&target, 
    //                 if overwrite { FileCopyFlags::OVERWRITE } else { FileCopyFlags::NONE }, 
    //                 Some(&gio::Cancellable::new()), 
    //                 Some(&mut cb))
    //         };
    //         let error = if let Err(error) = res {
    //             Some(FileError { description: error.to_string(), code: unsafe { (*error.into_raw()).code } } )
    //         } else { None };
    //         error
    //     } else { original_error };

    //     channel.send(move |mut cx| {
    //         let this = cx.undefined();
    //         let callback = callback.into_inner(&mut cx);
    //         let args = match error {
    //             None => {
    //                 let copied = cx.number(CopyStatus::get_value() as f64);
    //                 vec![ cx.null().upcast::<JsValue>(), copied.upcast::<JsValue>() ]
    //             },
    //             Some(error) => {
    //                 let obj: Handle<JsObject> = cx.empty_object();
    //                 let desc = cx.string(error.description);
    //                 obj.set(&mut cx, "description", desc)?;
    //                 let file_error = match error.code {
    //                     1  => FILE_NOT_FOUND,
    //                     14 => ACCESS_DENIED,
    //                     _ => UNKNOWN
    //                 };
    //                 let code = cx.number(file_error as f64);
    //                 obj.set(&mut cx, "fileResult", code)?;
    //                 vec![ obj.upcast::<JsValue>(), cx.null().upcast::<JsValue>() ]
    //             }
    //         }; 
    //         callback.call(&mut cx, this, args)?;
    //         Ok(())
    //     });
    // });
    Ok(cx.undefined())
}

pub fn trash_file(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let file_path = cx.argument::<JsString>(0)?.value(&mut cx);
    let file = File::for_path(file_path);
    
    fn trash(file: File) -> Result<(), FileError> {
        Ok(file.trash(Some(&gio::Cancellable::new()))?)
    }

    let promise = cx
        // Finish the stream on the Node worker pool
        .task(move || { trash(file) })    
        .promise(|mut cx, result: Result<(), FileError>| {
            match result {
                Ok(()) => Ok(cx.undefined()),
                Err(error) => {
                    let json = serde_json::to_string(&error).unwrap();
                    cx.throw_error(json)
                }
            }
        });

    Ok(promise)    
}    
    
fn get_copy_status(mut cx: FunctionContext) -> JsResult<JsNumber> {
    Ok(cx.number(CopyStatus::get_value() as f64))
}
