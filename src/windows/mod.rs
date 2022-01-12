use neon::prelude::*;
use std::{os::windows::fs::MetadataExt, fs::Metadata, ptr::null_mut, mem, ffi::c_void };
use systemicons::get_icon;
use winapi::{
    um::{
        fileapi::{
            CreateDirectoryW, GetLogicalDriveStringsW, GetVolumeInformationW, GetDiskFreeSpaceExW, GetDriveTypeW, CreateFileW, OPEN_EXISTING
        }, 
        errhandlingapi::GetLastError,
        winnt::{ULARGE_INTEGER, GENERIC_READ, FILE_SHARE_READ, FILE_SHARE_WRITE, FILE_SHARE_DELETE}, 
        handleapi::{INVALID_HANDLE_VALUE, CloseHandle}, 
        winioctl::FSCTL_IS_VOLUME_MOUNTED, ioapiset::DeviceIoControl, winver::{GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW}, 
    }, shared::{ntdef::{PWSTR}, minwindef::{DWORD, HIWORD, LOWORD}}
};

mod shell;

pub fn init_addon(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getIcon", get_icon_async)?;
    cx.export_function("createDirectory", create_directory)?;
    cx.export_function("toRecycleBin", to_recycle_bin)?;
    cx.export_function("getDrives", get_drives)?;
    cx.export_function("getFileVersion", get_file_version)?;
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

fn to_recycle_bin(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let files = cx.argument::<JsArray>(0)?.to_vec(&mut cx)?.iter().map(|item| {
        // TODO: unwrap -> ok().and_then
        let file: Handle<JsString> = item.downcast(&mut cx).unwrap();
        file.value(&mut cx)
    }).collect::<Vec<String>>();
    
    let callback = cx.argument::<JsFunction>(1)?.root(&mut cx);
    let channel = cx.channel();
    
    rayon::spawn(move || {
        //let path_ws = to_wstring(&path);
        // let mut result = unsafe { 
        //     match CreateDirectoryW(path_ws.as_ptr(), null_mut()) {
        //         0 => GetLastError(),
        //         _  => 0
        //     }
        // };
        channel.send(move |mut cx| {
            // let args = match result {
            //     0 => vec![ cx.null().upcast::<JsValue>() ],
            //     _  => {
            //         let err = cx.string("Could not create folder");
            //         vec![ err.upcast::<JsValue>() ]            
            //     }                    
            // };
            let this = cx.undefined();
            let callback = callback.into_inner(&mut cx);
//            callback.call(&mut cx, this, args)?;
            Ok(())
        });
    });
    Ok(cx.undefined())
}

#[derive(Copy, Clone, PartialEq)]
enum DriveType {
    UNKNOWN,
    HARDDRIVE,
    ROM,
    REMOVABLE,
    NETWORK,
}

struct DriveItem {
    name: String,
    description: String,
    size: u64,
    drive_type: DriveType,
    is_mounted: bool
}

fn get_drives(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    use std::slice::from_raw_parts;
    let callback = cx.argument::<JsFunction>(0)?.root(&mut cx);
    let channel = cx.channel();
    
    rayon::spawn(move || {
        let drives = unsafe {
            let mut buffer: Vec<u16> = Vec::with_capacity(500);
            let size = GetLogicalDriveStringsW(500, buffer.as_mut_ptr());
            let array: &[u16] = from_raw_parts(buffer.as_mut_ptr(), size as usize);
            let drives_string = String::from_utf16_lossy(array);
            let drives: Vec<&str> = drives_string.split("\0").collect();

            unsafe fn get_drive_description(item: &str) -> String {
                let path_ws = to_wstring(item);
                let mut buffer: Vec<u16> = Vec::with_capacity(500);
                match GetVolumeInformationW(path_ws.as_ptr(), buffer.as_mut_ptr(), 500, 
                    null_mut(), null_mut(), null_mut(), null_mut(), 0) {
                    0 => String::from(""),
                    _ => pwstr_to_string(buffer.as_mut_ptr())
                }
            }

            unsafe fn get_volume_size(item: &str) -> u64 {
                let path_ws = to_wstring(item);
                let mut ul: ULARGE_INTEGER = { mem::zeroed() };
                let _ = GetDiskFreeSpaceExW(path_ws.as_ptr(), null_mut(), &mut ul, null_mut());
                *ul.QuadPart()
            }

            unsafe fn get_drive_type(item: &str) -> DriveType {
                let path_ws = to_wstring(item);
                match GetDriveTypeW(path_ws.as_ptr()) {
                    2 => DriveType::REMOVABLE,
                    3 => DriveType::HARDDRIVE,
                    4 => DriveType::NETWORK,
                    5 => DriveType::ROM,
                    _ => DriveType::UNKNOWN
                }
            }

            unsafe fn is_mounted(item: &str) -> bool {
                let volume = format!("\\\\.\\{}", item[0..2].to_string());
                let path_ws = to_wstring(&volume);
                let handle = CreateFileW(path_ws.as_ptr(), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, null_mut(), 
                OPEN_EXISTING, 0, null_mut());
                if handle != INVALID_HANDLE_VALUE {
                    let result = DeviceIoControl(handle, FSCTL_IS_VOLUME_MOUNTED, null_mut(), 0, null_mut(), 
                    0, null_mut(), null_mut());
                    CloseHandle(handle);
                    result != 0
                } else {
            		// 2 means "no disk", anything else means by inference "disk
		            // in drive, but you do not have admin privs to do a
		            // CreateFile on that volume".
		            GetLastError() != 2
                }
            }

            drives.iter().filter_map(|&item| match &item.len() {
                0 => None,
                _ => {
                    let name = item.to_string();
                    let drive_type = get_drive_type(&name);
                    Some(DriveItem { 
                        name: name.clone(),
                        description: get_drive_description(&name),
                        size: get_volume_size(&name),
                        drive_type,
                        is_mounted: if drive_type == DriveType::HARDDRIVE { true} else { is_mounted(&name) }
                    }) 
                }
            }).collect::<Vec<DriveItem>>()
        };
        channel.send(move |mut cx| {
            let result: Handle<JsArray> = cx.empty_array();
            drives.iter().for_each(|item| {
                let obj: Handle<JsObject> = cx.empty_object();
                let name = cx.string(&item.name);
                let size = cx.number(item.size as f64);
                let description = cx.string(&item.description);
                let drive_type = cx.number(item.drive_type as i32 as f64);
                let is_mounted = cx.boolean(item.is_mounted);
                
                let _res = obj.set(&mut cx, "name", name);
                let _res = obj.set(&mut cx, "description", description);
                let _res = obj.set(&mut cx, "size", size);
                let _res = obj.set(&mut cx, "driveType", drive_type);
                let _res = obj.set(&mut cx, "isMounted", is_mounted);
                
                let len = result.len(&mut cx);                    
                let _res = result.set(&mut cx, len, obj);
            });
            let this = cx.undefined();
            let callback = callback.into_inner(&mut cx);
            callback.call(&mut cx, this,  vec![ result ])?;
            Ok(())
        });
    });
    Ok(cx.undefined())
}

struct FixedFileInfo {
    _signature: DWORD,           
    _struc_version: DWORD,
    file_version_ms: DWORD,
    file_version_ls: DWORD,
    _product_version_ms: DWORD,
    _product_version_ls: DWORD,
    _file_flags_mask: DWORD,
    _file_flags: DWORD,
    _file_os: DWORD,
    _file_type: DWORD,
    _file_sub_type: DWORD,
    _file_date_ms: DWORD,
    _ile_date_ls: DWORD
}

struct Version {
    major: u16,
    minor: u16,
    build: u16,
    patch: u16
}

fn get_file_version(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let path = cx.argument::<JsString>(0)?.value(&mut cx);
    let callback = cx.argument::<JsFunction>(1)?.root(&mut cx);
    let channel = cx.channel();
    
    rayon::spawn(move || {
        let version = unsafe {
            let path_ptr = to_wstring(&path);
            let mut h: DWORD = 0;
            let size = GetFileVersionInfoSizeW(path_ptr.as_ptr(), &mut h);
            if size != 0 {
                let mut buffer = vec![0u8; size as usize];
                GetFileVersionInfoW(path_ptr.as_ptr(), 0, size, buffer.as_mut_ptr() as *mut c_void);
                let p = to_wstring("\\");
                let mut info: *mut c_void = null_mut();
                let mut len = vec![0u32];
                VerQueryValueW(buffer.as_ptr() as *const c_void, p.as_ptr(), &mut info, len.as_mut_ptr());
                let info: &mut FixedFileInfo = &mut *(info as *mut FixedFileInfo);
                Some(Version {
                    major: HIWORD(info.file_version_ms),
                    minor: LOWORD(info.file_version_ms),                
                    build: HIWORD(info.file_version_ls),
                    patch: LOWORD(info.file_version_ls),
                })
            } else { None }
        };
        channel.send(move |mut cx| {
            let this = cx.undefined();
            let callback = callback.into_inner(&mut cx);
            let args = match version {
                Some(version) => {
                    let obj: Handle<JsObject> = cx.empty_object();
                    let major = cx.number(version.major as f64);
                    let minor = cx.number(version.minor as f64);
                    let build = cx.number(version.build as f64);
                    let patch = cx.number(version.patch as f64);
                    let _res = obj.set(&mut cx, "major", major);
                    let _res = obj.set(&mut cx, "minor", minor);
                    let _res = obj.set(&mut cx, "build", build);
                    let _res = obj.set(&mut cx, "patch", patch);
                    vec![ obj.upcast::<JsValue>() ]
                },
                None => vec![ cx.null().upcast::<JsValue>() ]
            };
            callback.call(&mut cx, this,  args)?;
            Ok(())
        });
    });
    Ok(cx.undefined())
}

