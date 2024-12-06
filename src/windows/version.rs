use std::{ffi::c_void, path::PathBuf, ptr};

use windows::{core::{w, PCWSTR}, Win32::{
    Foundation::TRUE, Storage::FileSystem::{GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW, VS_FIXEDFILEINFO}}
};

use crate::extended_items::Version;

use super::string_to_pcwstr;

pub fn get_version(path: &str, item: &str) -> Option<Version> {
    let lower_item = item.to_lowercase();
    if lower_item.ends_with(".exe") || lower_item.ends_with(".dll") {
        version(&PathBuf::from(path).join(item))
    } else {
        None            
    }
    
}

fn version(file: &PathBuf)->Option<Version> {
    let file = string_to_pcwstr(&file.to_string_lossy());
    let size = unsafe { GetFileVersionInfoSizeW(PCWSTR(file.as_ptr()), None) };
    let mut buffer = vec![0u8; size as usize];
    unsafe { 
        GetFileVersionInfoW(PCWSTR(file.as_ptr()), 0, size, buffer.as_mut_ptr() as *mut c_void).ok()?
    };
    let mut value_ptr: *mut c_void = ptr::null_mut();
    let mut size:u32 = 0;
    if unsafe { VerQueryValueW(buffer.as_ptr() as *mut c_void, w!("\\"), &mut value_ptr, &mut size) == TRUE && !value_ptr.is_null() } {
        Some(())
    } else {
        None
    }?;
    let info = unsafe { &*(value_ptr as *const VS_FIXEDFILEINFO) };
    Some (Version {
        major: (info.dwFileVersionMS>> 16) & 0xffff,
        minor: info.dwFileVersionMS & 0xffff,
        build: (info.dwFileVersionLS >> 16) & 0xffff,
        patch: info.dwFileVersionLS & 0xffff
    })
}

