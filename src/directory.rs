use std::{
    fs::{
        self, canonicalize, create_dir, create_dir_all, read_dir, rename, File
    }, io::{
        BufReader, BufWriter, ErrorKind, Read, Write
    }, path::PathBuf, sync::{mpsc::{channel, Receiver}, Mutex, MutexGuard, TryLockResult}, time::UNIX_EPOCH};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_repr::Deserialize_repr;
use urlencoding::decode;
use trash::delete_all;

use crate::{cancellations::{self, cancel, CancellationType}, error::Error, progresses::{CurrentProgress, ProgressStream, TotalProgress}, 
    remote::copy_from_remote, request_error::{ErrorType, RequestError}};

#[cfg(target_os = "windows")]
use crate::windows::directory::{is_hidden, StringExt, get_icon_path, ConflictItem, update_directory_item, copy_attributes, move_item};
#[cfg(target_os = "linux")]
use crate::linux::directory::{is_hidden, StringExt, get_icon_path, mount, update_directory_item, ConflictItem, copy_attributes, move_item};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetFiles {
    pub path: String,
    pub show_hidden_items: bool,
    #[cfg(target_os = "linux")]
    pub mount: bool
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFolder {
    pub path: String,
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteItems {
    pub path: String,
    pub names: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameItem {
    pub path: String,
    pub name: String,
    pub new_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryItem {
    pub name: String,
    pub size: u64,
    pub is_directory: bool,
    pub icon_path: Option<String>,
    pub is_hidden: bool,
    pub time: Option<DateTime<Utc>>
}

impl DirectoryItem {
    pub fn copy(&self)->Self {
        Self {
            name: self.name.clone(),
            icon_path: self.icon_path.clone(),
            ..*self
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetFilesResult {
    pub items: Vec<DirectoryItem>,
    pub path: String,
    pub dir_count: usize,
    pub file_count: usize,
}

#[derive(Debug, Deserialize_repr, PartialEq)]
#[repr(u32)]
pub enum JobType {
    Copy = 0,
    Move = 1,
    CopyToRemote = 2,
    CopyFromRemote = 3,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyItems {
    pub path: String,
    pub target_path: String,
    pub items: Vec<CopyItem>,
    pub job_type: JobType
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyItem {
    pub name: String,
    pub size: u64
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameItemsParam {
    path: String,
    items: Vec<RenameItemsItem>
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameItemsItem {
    name: String,
    new_name: String
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckCoypItems {
    path: String,
    target_path: String,
    items: Vec<DirectoryItem>

}

pub fn get_files(input: GetFiles)->Result<GetFilesResult, RequestError> {
    let path = canonicalize(&input.path)
        .ok()
        .map(|p|p.to_string_lossy().to_string().clean_path())
        .unwrap_or_else(||input.path.clone());

    #[cfg(target_os = "linux")]
    let path = if input.mount { mount(&path) } else { path };
    
    let items: Vec<DirectoryItem> = read_dir(&path)
        ?.filter_map(|file|file.ok())
        .filter_map(|file| {
            if let Ok(metadata) = file.metadata() {
                Some((file, metadata))
            } else {
                None
            }
        })
        .map(|(entry, meta)| {
            let name = entry.file_name().to_str().unwrap_or_default().to_string();
            let is_directory = meta.is_dir();
            DirectoryItem {
                is_hidden: is_hidden(&name.as_str(), &meta),
                is_directory,
                size: meta.len(),
                time: meta.modified()
                            .ok()
                            .and_then(|t|t.duration_since(UNIX_EPOCH).ok())
                            .map(|d|DateTime::from_timestamp_nanos(d.as_nanos() as i64)), 
                icon_path: get_icon_path_of_file(&name, &path, is_directory).map(|s|s.to_string()),
                name
            }
        })
        .filter(|item| input.show_hidden_items || !item.is_hidden )
        .collect();
    let dir_count = items.iter().filter(|i|i.is_directory).count();

    Ok(GetFilesResult {
        path,
        dir_count,
        file_count: items.len() - dir_count, 
        items,
    })
}

pub fn get_extension(name: &str)->Option<&str> {
    match name.rfind('.') {
        Some(idx) if idx > 0 => {
            Some(&name[idx..])
        },
        _ => None
    }
}

pub fn get_file(path: &str)->Result<(String, File), Error> {
    let pos_end = path.find('?');
    let path = if let Some(pos_end) = pos_end { &path[..pos_end] } else { path };
    let path = decode(path)?.to_string();
    let file = File::open(&path)?;
    Ok((path, file))
}

pub fn create_folder(input: CreateFolder)->Result<(), RequestError> {
    let new_path = PathBuf::from(input.path).join(input.name);
    create_dir(new_path)?;
    Ok(())
}

pub fn delete_items(input: DeleteItems)->Result<(), RequestError> {
    delete_all(input.names.iter().map(|n|PathBuf::from(&input.path).join(n)))?;
    Ok(())
}

pub fn rename_item(input: RenameItem)->Result<(), RequestError> {
    let path = PathBuf::from(&input.path).join(input.name);
    let new_path = PathBuf::from(input.path).join(input.new_name);
    rename(path, new_path)?;
    Ok(())
}

pub fn rename_as_copy(input: RenameItem)->Result<(), RequestError> {
    let path = PathBuf::from(&input.path);
    let source_file = File::open(path.join(input.name))?;
    let target_file = File::create(path.join(input.new_name))?;

    let mut source_stream = BufReader::new(&source_file);
    let mut target_stream = BufWriter::new(&target_file);
    let mut buf = vec![0; 8192];

    loop {
        let read = source_stream.read(&mut buf)?;
        if read == 0 {
            break;
        }
        let buf_slice = &mut buf[..read];
        target_stream.write(buf_slice)?;
    }
    target_stream.flush()?;
    copy_attributes(&source_file, &target_file)?;
    Ok(())
}

pub fn try_copy_lock()->TryLockResult<MutexGuard<'static, bool>> {
    MUTEX.try_lock()
}

pub fn rename_items(input: RenameItemsParam)->Result<(), RequestError> {
    for item in &input.items {
        let path = PathBuf::from(&input.path).join(&item.name);
        let new_path = PathBuf::from(&input.path).join("__RENAMING__".to_string() + &item.new_name);
        rename(path, new_path)?;
    }
    for item in &input.items {
        let path = PathBuf::from(&input.path).join("__RENAMING__".to_string() + &item.new_name);        
        let new_path = PathBuf::from(&input.path).join(&item.new_name);
        rename(path, new_path)?;
    }
    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyItemResult {
    items: Vec<DirectoryItem>,
    conflicts: Vec<ConflictItem>
}

pub fn check_copy_items(input: CheckCoypItems)->Result<CopyItemResult, RequestError> {
    let conflict_items = 
        flatten_directories(&input.path, input.items)?
            .into_iter()
            .map(|di|create_copy_item(di, &input.path, &input.target_path))
            .collect::<Result<Vec<_>, RequestError>>()?;
    let (items, conflicts): (Vec<Option<DirectoryItem>>, Vec<Option<ConflictItem>>) = conflict_items.into_iter().unzip();
    let items: Vec<DirectoryItem> = items.into_iter().filter_map(|f|f).collect();
    let conflicts: Vec<ConflictItem> = conflicts.into_iter().filter_map(|f|f).collect();
    Ok(CopyItemResult { items, conflicts })
}

pub fn copy_items(input: CopyItems)->Result<(), RequestError> {

    let _binding = try_copy_lock()?;

    let (snd, rcv) = channel::<bool>();
    cancellations::reset(None, CancellationType::Copy, snd);

    let total_progress = TotalProgress::new(
        input.items.iter().fold(0u64, |curr, i|i.size + curr), 
        input.items.len() as u32, 
        input.job_type == JobType::Move
    );

    for file in input
        .items
        .iter()
        .take_while(|_| match rcv.try_recv() {
            Err(std::sync::mpsc::TryRecvError::Empty) => true,
            _ => false
        }) {
            let current_progress = CurrentProgress::new(&total_progress, &file.name, file.size);
            match input.job_type {
                JobType::Copy => copy_item(false, &input, &file.name, file.size, &current_progress, &rcv),
                JobType::Move => copy_item(true, &input, &file.name, file.size, &current_progress, &rcv),
                JobType::CopyFromRemote => copy_from_remote(false, &input, &file.name, &current_progress, &rcv),
                _ => return Err(RequestError { status: ErrorType::NotSupported })
            }?;
        };
    Ok(())
}

pub fn copy_not_cancelled(rcv: &Receiver<bool>)->bool {
    if let Err(std::sync::mpsc::TryRecvError::Empty) = rcv.try_recv() {
        true
    } else {
        let _ = cancel(None, CancellationType::Copy);
        false
    }
}

fn flatten_directories(path: &str, items: Vec<DirectoryItem>)->Result<Vec<DirectoryItem>, RequestError> {
    items
        .into_iter()
        .map(|n| match n.is_directory {
            false => Ok(Vec::from([n])),
            true => unpack_directory(path, &n.name),
        })
        .collect::<Result<Vec<Vec<DirectoryItem>>, RequestError>>()
        .map(|n|
                n.into_iter()
                .flatten()
                .collect())
}

fn unpack_directory(path: &str, sub_path: &str)->Result<Vec<DirectoryItem>, RequestError> {
    let items: Vec<DirectoryItem> = read_dir(PathBuf::from(path).join(sub_path))
        ?.filter_map(|file|file.ok())
        .filter_map(|file| {
            if let Ok(metadata) = file.metadata() {
                Some((file, metadata))
            } else {
                None
            }
        })
        .map(|(entry, meta)| {
            let name = PathBuf::from(sub_path).join(entry.file_name().to_str().unwrap_or_default()).to_string_lossy().to_string();
            let is_directory = meta.is_dir();
            DirectoryItem {
                is_hidden: false,
                is_directory,
                size: meta.len(),
                time: meta.modified()
                            .ok()
                            .and_then(|t|t.duration_since(UNIX_EPOCH).ok())
                            .map(|d|DateTime::from_timestamp_nanos(d.as_nanos() as i64)), 
                icon_path: get_icon_path_of_file(&name, &path, is_directory).map(|s|s.to_string()),
                name
            }
        })
        .collect();
    return flatten_directories(path, items)
}

fn create_copy_item(item: DirectoryItem, path: &str, target_path: &str)->Result<(Option<DirectoryItem>, Option<ConflictItem>), RequestError> { 
    let updated_item = match fs::metadata(PathBuf::from(path).join(&item.name)) {
        Ok (meta) => Ok(Some(update_directory_item(item.copy(), &meta))),
        Err (err) if err.kind() == ErrorKind::NotFound => Ok(None),
        Err (err) => Err(err)
    }?;

    let conflict = updated_item.as_ref().and_then(|n| {
        match fs::metadata(PathBuf::from(target_path).join(&n.name)) {
            Ok (meta) => Some(ConflictItem::from(path, target_path, &n, &meta)),
            _ => None,
        }
    });

    Ok((updated_item, conflict))
}

fn copy_item(mov: bool, input: &CopyItems, file: &str, size: u64, progress: &CurrentProgress, rcv: &Receiver<bool>)->Result<(), RequestError> {
    let source_path = PathBuf::from(&input.path).join(file);
    let target_path = PathBuf::from(&input.target_path).join(file);
    if !mov {
        copy(&source_path, &target_path, size, progress, rcv)?;  
    } else {
        if let Some(p) = target_path.parent() {
            if let Ok(true) = fs::exists(p) {}
            else {
                create_dir_all(p)?
            }
        }
        match move_item(&source_path, &target_path) {
            Err(err) if err.status == ErrorType::NotSupported => {
                copy(&source_path, &target_path, size, progress, rcv)?;
                let _ = rm_rf::remove(&source_path);
            },
            Err(err) => return Err(err),
            _ => {}
        }
    }
    Ok(())
}

fn copy(source_path: &PathBuf, target_path: &PathBuf, size: u64, progress: &CurrentProgress, rcv: &Receiver<bool>)->Result<(), RequestError> {
    let source_file = File::open(source_path)?;
    let _ = rm_rf::remove(&target_path);
    let target_file = match File::create(target_path) {
        Err(e) if e.kind() == ErrorKind::NotFound => {
            match target_path.parent() {
                Some(p) => {
                    create_dir_all(p)?;
                    File::create(target_path)?
                }
                None => Err(e)?
            }
        },
        Err(e) => Err(e)?,
        Ok(tf) => tf,
    };
    let mut source_stream = BufReader::new(&source_file);
    let mut target_stream = ProgressStream::new(BufWriter::new(&target_file), |p| progress.send_bytes(p as u64));
    let mut buf = vec![0; usize::min(8192, size as usize)];

    while copy_not_cancelled(rcv) {
        let read = source_stream.read(&mut buf)?;
        if read == 0 {
            break;
        }
        let buf_slice = &mut buf[..read];
        target_stream.write(buf_slice)?;
    }
    target_stream.flush()?;
    copy_attributes(&source_file, &target_file)?;
    Ok(())
}

fn get_icon_path_of_file(name: &str, path: &str, is_directory: bool)->Option<String> {
    if !is_directory {
        get_icon_path(name, path)
    } else {
        None
    }
}

static MUTEX: Mutex<bool> = Mutex::new(false);