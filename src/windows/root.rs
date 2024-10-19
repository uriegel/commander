use std::{mem, ptr::null_mut, slice::from_raw_parts};

use serde::Serialize;
use winapi::um::{
    errhandlingapi::GetLastError, 
    handleapi::{INVALID_HANDLE_VALUE, CloseHandle}, 
    fileapi::{
        CreateFileW, GetDiskFreeSpaceExW, GetDriveTypeW, GetLogicalDriveStringsW, GetVolumeInformationW, OPEN_EXISTING}, ioapiset::DeviceIoControl, 
        winioctl::FSCTL_IS_VOLUME_MOUNTED, 
        winnt::{
            FILE_SHARE_DELETE, FILE_SHARE_READ, FILE_SHARE_WRITE, GENERIC_READ, ULARGE_INTEGER
        }
    };

use crate::{requests::ItemsResult, windows::{pwstr_to_string, to_wstring}};

#[derive(Debug)]
#[derive(Copy, Clone, PartialEq)]
enum DriveType {
    UNKNOWN,
    HARDDRIVE,
    ROM,
    REMOVABLE,
    NETWORK,
}

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RootItem {
    pub name: String,
    pub size: usize,
    pub description: String,
    pub mount_point: String,
    pub is_mounted: bool,
    pub drive_type: String,
}

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorItem {
    pub kind: i32
}

pub fn get_root()->ItemsResult<Vec<RootItem>> {
    unsafe {
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
//         		// 2 means "no disk", anything else means by inference "disk
// 	            // in drive, but you do not have admin privs to do a
// 	            // CreateFile on that volume".
                GetLastError() != 2
            }
        }

        ItemsResult {
            ok: drives.iter().filter_map(|&item| match &item.len() {
                0 => None,
                _ => {
                    let name = item.to_string();
                    let drive_type = get_drive_type(&name);
                    Some(RootItem { 
                        name: name.clone(),
                        description: get_drive_description(&name),
                        size: get_volume_size(&name) as usize,
                        mount_point: "".to_string(),
                        drive_type: "".to_string(),
                        is_mounted: if drive_type == DriveType::HARDDRIVE { true} else { is_mounted(&name) }
                    }) 
                }
            }).collect::<Vec<RootItem>>()
        }
    }
}

// TODO 3.2.22 rust neon