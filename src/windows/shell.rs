use core::ptr::null_mut;
use crate::windows::pwstr_to_string;
use crate::windows::to_wstring;
use std::path::{ Path };
use winapi::{
    um::{
        fileapi::{
            GetTempFileNameW, GetTempPathW, DeleteFileW, CreateDirectoryW, RemoveDirectoryW
        }, shellapi::{
            SHFILEOPSTRUCTW, SHFileOperationW
        }
    }, shared::{minwindef::MAX_PATH}
};

pub unsafe fn create_directory(path: &str) {
    let mut buffer: Vec<u16> = Vec::with_capacity(MAX_PATH as usize);
    let _res = GetTempPathW(MAX_PATH as u32, buffer.as_mut_ptr());
    let mut temp_file_name_buffer: Vec<u16> = Vec::with_capacity(MAX_PATH as usize);
    let _res = GetTempFileNameW(buffer.as_ptr(), to_wstring("xxx").as_ptr(), 0, temp_file_name_buffer.as_mut_ptr()); 
    let tempfile_name = pwstr_to_string(temp_file_name_buffer.as_mut_ptr());

    let path_obj = Path::new(&path);
    let new_name = path_obj.file_name().unwrap_or_default();
    
    let newtemppath = Path::new(&tempfile_name).join(new_name); 
    let new_temppath = newtemppath.display().to_string();
    let _res = DeleteFileW(temp_file_name_buffer.as_ptr());
    let _res = CreateDirectoryW(temp_file_name_buffer.as_ptr(), null_mut());
    let mut new_temp_path_ptr = to_wstring(&new_temppath);
    let _res = CreateDirectoryW(new_temp_path_ptr.as_ptr(), null_mut());

    new_temp_path_ptr.push(0);

    let target_path = path_obj.parent().unwrap();
    let mut target_path_ptr = to_wstring(&target_path.display().to_string());
    target_path_ptr.push(0);    

    let mut fileop = SHFILEOPSTRUCTW {
        hwnd: null_mut(),
        fAnyOperationsAborted: 0,
        fFlags: 0,
        hNameMappings: null_mut(),
        lpszProgressTitle: null_mut(),
        pFrom: new_temp_path_ptr.as_ptr(),
        pTo: target_path_ptr.as_ptr(),
        wFunc: FO_MOVE
    };
    let _res = SHFileOperationW(&mut fileop);
    RemoveDirectoryW(temp_file_name_buffer.as_ptr());
}

pub unsafe fn to_recycle_bin(pathes: &Vec<String>) -> bool {
    let pathes_str = pathes.join("\0");
    let mut pathes_ptr = to_wstring(&pathes_str);
    pathes_ptr.push(0);    
    
    let mut fileop = SHFILEOPSTRUCTW {
        hwnd: null_mut(),
        fAnyOperationsAborted: 0,
        fFlags: FOF_NOCONFIRMATION | FOF_ALLOWUNDO,
        hNameMappings: null_mut(),
        lpszProgressTitle: null_mut(),
        pFrom: pathes_ptr.as_ptr(),
        pTo: null_mut(),
        wFunc: FO_DELETE
    };

    let res = SHFileOperationW(&mut fileop);
    res == 0
}

pub unsafe fn copy_files(source_files: &Vec<String>, target_files: &Vec<String>, move_files: bool) -> bool {
    let source_files_str = source_files.join("\0");
    let mut source_files_ptr = to_wstring(&source_files_str);
    source_files_ptr.push(0);    
    
    let target_files_str = target_files.join("\0");
    let mut target_files_ptr = to_wstring(&target_files_str);
    target_files_ptr.push(0);    

    let mut fileop = SHFILEOPSTRUCTW {
        hwnd: null_mut(),
        fAnyOperationsAborted: 0,
        fFlags:  FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR | FOF_MULTIDESTFILES,
        hNameMappings: null_mut(),
        lpszProgressTitle: null_mut(),
        pFrom: source_files_ptr.as_ptr(),
        pTo: target_files_ptr.as_ptr(),
        wFunc: if move_files { FO_MOVE } else { FO_COPY }
    };

    let res = SHFileOperationW(&mut fileop);
    res == 0
}

const FO_MOVE: u32 = 0x0001;
const FO_COPY: u32 = 0x0002;
const FO_DELETE: u32 = 0x0003;
// const FO_RENAME: u32 = 0x0004;

const FOF_MULTIDESTFILES: u16 = 0x0001;
// const FOF_CONFIRMMOUSE: u16 = 0x0002;
// const FOF_SILENT: u16 = 0x0004;  // don't display progress UI (confirm prompts may be displayed still)
// const FOF_RENAMEONCOLLISION: u16 = 0x0008;  // automatically rename the source files to avoid the collisions
const FOF_NOCONFIRMATION: u16 = 0x0010;  // don't display confirmation UI, assume "yes" for cases that can be bypassed, "no" for those that can not
// const FOF_WANTMAPPINGHANDLE: u16 = 0x0020;  // Fill in SHFILEOPSTRUCT.hNameMappings
//                                          // Must be freed using SHFreeNameMappings
const FOF_ALLOWUNDO: u16 = 0x0040;  // enable undo including Recycle behavior for IFileOperation::Delete()
// const FOF_FILESONLY: u16 = 0x0080;  // only operate on the files (non folders), both files and folders are assumed without this
// const FOF_SIMPLEPROGRESS: u16 = 0x0100;  // means don't show names of files
const FOF_NOCONFIRMMKDIR: u16 = 0x0200;  // don't dispplay confirmatino UI before making any needed directories, assume "Yes" in these cases
// const FOF_NOERRORUI: u16 = 0x0400;  // don't put up error UI, other UI may be displayed, progress, confirmations
// const FOF_NOCOPYSECURITYATTRIBS: u16 = 0x0800;  // dont copy file security attributes (ACLs)
// const FOF_NORECURSION: u16 = 0x1000;  // don't recurse into directories for operations that would recurse
// const FOF_NO_CONNECTED_ELEMENTS: u16 = 0x2000;  // don't operate on connected elements ("xxx_files" folders that go with .htm files)
// const FOF_WANTNUKEWARNING: u16 = 0x4000;  // during delete operation, warn if object is being permanently destroyed instead of recycling (partially overrides FOF_NOCONFIRMATION)