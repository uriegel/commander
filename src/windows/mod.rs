use neon::prelude::*;
use std::{os::windows::fs::MetadataExt, fs::Metadata, ptr::null_mut };
use systemicons::get_icon;
use winapi::{
    um::{
        fileapi::{
            CreateDirectoryW, GetLogicalDriveStringsW
        }, errhandlingapi::GetLastError
    }, shared::ntdef::PWSTR 
};

mod shell;

pub fn init_addon(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getIcon", get_icon_async)?;
    cx.export_function("createDirectory", create_directory)?;
    cx.export_function("getDrives", get_drives)?;
    Ok(())
}

// Get win32 lpstr from &str, converting u8 to u16 and appending '\0'
// See retep998's traits for a more general solution: https://users.rust-lang.org/t/tidy-pattern-to-work-with-lpstr-mutable-char-array/2976/2
pub fn to_wstring(value: &str) -> Vec<u16> {
    use std::os::windows::ffi::OsStrExt;

    std::ffi::OsStr::new(value)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect()
}

pub unsafe fn pwstr_to_string(ptr: PWSTR) -> String {
    use std::slice::from_raw_parts;
    let len = (0_usize..)
        .find(|&n| *ptr.offset(n as isize) == 0)
        .expect("Couldn't find null terminator");
    let array: &[u16] = from_raw_parts(ptr, len);
    String::from_utf16_lossy(array)
}

pub fn is_hidden(_: &str, metadata: &Metadata)->bool {
    let attrs = metadata.file_attributes();
    attrs & 2 == 2
}

fn get_icon_async(mut cx: FunctionContext) -> JsResult<JsUndefined> {

    let ext = cx.argument::<JsString>(0)?.value(&mut cx);
    let size = cx.argument::<JsNumber>(1)?.value(&mut cx);
    let callback = cx.argument::<JsFunction>(2)?.root(&mut cx);
    let channel = cx.channel();
    
    rayon::spawn(move || {
        let result = get_icon(&ext, size as i32);
        channel.send(move |mut cx| {
            let args = match result {
                Ok(buffer) => {
                    let mut js_buffer = cx.buffer(buffer.len() as u32)?;
                    cx.borrow_mut(&mut js_buffer, |js_buffer| {
                        let buf = js_buffer.as_mut_slice();
                        buf.copy_from_slice(&buffer);
                    });
                
                    vec![
                        cx.null().upcast::<JsValue>(),
                        js_buffer.upcast(),
                    ]
                }
                Err(_err) => {
                    let err = cx.string("Could not get icon buffer");
                    vec![
                        err.upcast::<JsValue>(),
                    ]            
                }
            };
            let this = cx.undefined();
            let callback = callback.into_inner(&mut cx);
            callback.call(&mut cx, this, args)?;
            Ok(())
        });
    });
    Ok(cx.undefined())
}

fn create_directory(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let path = cx.argument::<JsString>(0)?.value(&mut cx);
    let callback = cx.argument::<JsFunction>(1)?.root(&mut cx);
    let channel = cx.channel();
    
    rayon::spawn(move || {
        let path_ws = to_wstring(&path);
        let mut result = unsafe { 
            match CreateDirectoryW(path_ws.as_ptr(), null_mut()) {
                0 => GetLastError(),
                _  => 0
            }
        };
        if result == 5 {
            unsafe {shell::create_directory(&path); }
            result = 0
        }
        channel.send(move |mut cx| {
            let args = match result {
                0 => vec![ cx.null().upcast::<JsValue>() ],
                _  => {
                    let err = cx.string("Could not create folder");
                    vec![ err.upcast::<JsValue>() ]            
                }                    
            };
            let this = cx.undefined();
            let callback = callback.into_inner(&mut cx);
            callback.call(&mut cx, this, args)?;
            Ok(())
        });
    });
    Ok(cx.undefined())
}

fn get_drives(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    use std::slice::from_raw_parts;
    unsafe {
        let mut buffer: Vec<u16> = Vec::with_capacity(500);
        let size = GetLogicalDriveStringsW(500, buffer.as_mut_ptr());
        let array: &[u16] = from_raw_parts(buffer.as_mut_ptr(), size as usize);
        let drives_string = String::from_utf16_lossy(array);
        let drives: Vec<&str> = drives_string.split("\0").collect();
        let affe = drives.iter().map(|&item| {
            item
        });
    }
    Ok(cx.undefined())
}

