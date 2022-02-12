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

    let path = get_icon_as_file(&ext, 16).unwrap_or(String::from(""));
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
                    15 => FileErrorType::TrashNotPossible,
                    _  => FileErrorType::Unknown
                }                
        } 
    }
}

fn copy_file(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let file_path = cx.argument::<JsString>(0)?.value(&mut cx);
    let target_path = cx.argument::<JsString>(1)?.value(&mut cx);
    let move_file = if cx.len() > 2 {
        cx.argument::<JsBoolean>(2)?.value(&mut cx)
    } else {
        false
    };
    let overwrite = if cx.len() > 3 {
        cx.argument::<JsBoolean>(3)?.value(&mut cx)
    } else {
        false
    };
        
    let file = File::for_path(file_path);
    let target = File::for_path(target_path);

    let promise = cx
        // Finish the stream on the Node worker pool
        .task(move || { 
            let mut cb = |a, _b |{
                CopyStatus::add_value(a as usize);
            };

            if move_file {
                file.move_(&target, 
                    if overwrite { FileCopyFlags::OVERWRITE } else { FileCopyFlags::NONE }, 
                    Some(&gio::Cancellable::new()), 
                    Some(&mut cb))
            } else {
                file.copy(&target, 
                    if overwrite { FileCopyFlags::OVERWRITE } else { FileCopyFlags::NONE }, 
                    Some(&gio::Cancellable::new()), 
                    Some(&mut cb))
            }.or_else(|err| {
                let err = FileError::from(err);
                if err.code == FileErrorType::FileNotFound && file.query_exists(Some(&gio::Cancellable::new())) {
                    let parent = target.parent().unwrap();
                    let _res = parent.make_directory_with_parents(Some(&gio::Cancellable::new()));
                    if move_file {
                        file.move_(&target, 
                            if overwrite { FileCopyFlags::OVERWRITE } else { FileCopyFlags::NONE }, 
                            Some(&gio::Cancellable::new()), 
                            Some(&mut cb))
                    } else {
                        file.copy(&target, 
                            if overwrite { FileCopyFlags::OVERWRITE } else { FileCopyFlags::NONE }, 
                            Some(&gio::Cancellable::new()), 
                            Some(&mut cb))
                    }.or_else(|err| { Err(FileError::from(err)) })
                } else { Err(err) }
            })
        })
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
