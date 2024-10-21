use serde::Serialize;
use windows::{
    core::PCWSTR, Win32::Storage::FileSystem::{
        GetDiskFreeSpaceExW, GetDriveTypeW, GetLogicalDriveStringsW, GetVolumeInformationW 
    }
};

use crate::{requests::ItemsResult, windows::{string_from_pcwstr, string_to_pcwstr}};

#[derive(Debug)]
#[derive(Copy, Clone, PartialEq)]
enum _DriveType {
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
    pub size: u64,
    pub description: String,
    pub is_mounted: bool,
}

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorItem {
    pub kind: i32
}

pub fn get_root()->ItemsResult<Vec<RootItem>> {
    let mut drives: [u16; 512] = [0; 512];
    let len = unsafe { GetLogicalDriveStringsW(Some(&mut drives)) };
    let drives_string = String::from_utf16_lossy(&drives[..len as usize]);
    let drives: Vec<&str> = drives_string
        .split("\0")
        .take_while(|d|*d != "")
        .collect();

        fn get_drive_description(drive: &str) -> String {
            unsafe { 
                let drive = string_to_pcwstr(&drive);
                let mut desc_buffer = [0u16; 256];
                GetVolumeInformationW(
                    PCWSTR(drive.as_ptr()), 
                    Some(&mut desc_buffer), 
                    None, 
                    None,
                    None,
                    None)
                .ok()
                .map(|_|string_from_pcwstr(&desc_buffer))
                .unwrap_or("".to_string())
            }
        }
        
        fn get_volume_size(drive: &str) -> u64 {
            let drive = string_to_pcwstr(&drive);
            let mut size: u64 = 0;
            let _ = unsafe { GetDiskFreeSpaceExW(PCWSTR(drive.as_ptr()), None, Some(&mut size), None) };
            size 
        }

        fn _get_drive_type(drive: &str) -> _DriveType {
            let drive = string_to_pcwstr(&drive);
            match unsafe { GetDriveTypeW(PCWSTR(drive.as_ptr())) } {
                2 => _DriveType::REMOVABLE,
                3 => _DriveType::HARDDRIVE,
                4 => _DriveType::NETWORK,
                5 => _DriveType::ROM,
                _ => _DriveType::UNKNOWN
            }
        }

//         fn is_mounted(item: &str) -> bool {
//             let volume = format!("\\\\.\\{}", drive[0..2].to_string());
//             let volume = string_to_pcwstr(&volume);
//             unsafe {
//                 let handle = CreateFileW(PCWSTR(volume.as_ptr()), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, None, 
//                     OPEN_EXISTING, 0, None);
//                 if handle != INVALID_HANDLE_VALUE {
//                     let result = DeviceIoharley
//                     Control(handle, FSCTL_IS_VOLUME_MOUNTED, null_mut(), 0, null_mut(), 
//                         0, null_mut(), null_mut());
//                     CloseHandle(handle);
//                     result != 0
//                 } else {
// //         		// 2 means "no disk", anything else means by inference "disk
// // 	            // in drive, but you do not have admin privs to do a
// // 	            // CreateFile on that volume".
//                 GetLastError() != 2
//                 }
//             }
//         }
        
    ItemsResult {
        ok: drives.iter().map(|&item| {
            let name = item.to_string();
            RootItem { 
                name: name.clone(),
                description: get_drive_description(&name),
                size: get_volume_size(&name),
                is_mounted: true
            }
        }).collect::<Vec<RootItem>>()
    }
}

// TODO 3.2.22 rust neon