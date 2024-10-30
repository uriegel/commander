use std::{collections::HashMap, path::Path, sync::{Arc, Mutex, Once}};

use async_channel::{Receiver, Sender};
use notify::{event::ModifyKind, Event, EventHandler, EventKind, RecursiveMode, Watcher};

#[cfg(target_os = "linux")]
use notify::INotifyWatcher;
#[cfg(target_os = "windows")]
use notify::ReadDirectoryChangesWatcher;

#[derive(Debug)]
enum DirectoryChangedType {
    Created,
    Changed,
    Renamed,
    Deleted
} 

#[derive(Debug)]
struct DirectoryChangedEvent {
    folder_id: String,
    path: String,
    kind: DirectoryChangedType, 
    item: String, //DirectoryItem, 
    old_name: Option<String>,
}

pub fn add_dir_watching(id: &str, path: &str) {
    let mut watchers = get_watchers().lock().unwrap();
    let channel = get_channel().lock().unwrap();
    let _ = watchers.insert(id.to_string(), DirWatcher::new(id, path, channel.sender.clone()));
}

struct DirWatcher {
    #[cfg(target_os = "linux")]
    _watcher: INotifyWatcher,
    #[cfg(target_os = "windows")]
    _watcher: ReadDirectoryChangesWatcher
}   

impl DirWatcher {
    pub fn new(folder_id: &str, path: &str, snd: Sender<String>)->Self {
        let handler = DirWatcherHandler { snd, path: path.to_string(), folder_id: folder_id.to_string() };
        let mut watcher = notify::recommended_watcher(handler).unwrap();        
        watcher.watch(Path::new(&path), RecursiveMode::NonRecursive).unwrap();
        Self {
            _watcher: watcher
        }
    }
}

#[derive(Clone)]
struct DirWatcherHandler {
    snd: Sender<String>,
    folder_id: String,
    path: String
}
impl EventHandler for DirWatcherHandler {
    fn handle_event(&mut self, event: Result<Event, notify::Error>) {
        if let Ok(event) = event {
            let kind = match event.kind {
                EventKind::Create(_) => Some(DirectoryChangedType::Created),
                EventKind::Remove(_) => Some(DirectoryChangedType::Deleted),                    
                EventKind::Modify(ModifyKind::Name(_)) => Some(DirectoryChangedType::Renamed),                    
                EventKind::Modify(_) => Some(DirectoryChangedType::Changed),                    
                _ => None,                    
            };
            let evt = kind.map(|kind| DirectoryChangedEvent {
                folder_id: self.folder_id.clone(),
                item: event.paths.first().map(|p|p.to_string_lossy().to_string()).unwrap_or("".to_string()),
                path: self.path.clone(), 
                kind,
                old_name: if event.paths.len() > 1 { event.paths.last().map(|p|p.to_string_lossy().to_string()) } else { None } ,
            });
            evt.inspect(|evt|{
                println!("Event: {:?}", evt);
                let _ = self.snd.send_blocking(format!("{:?}", evt));
            });
        }
    }
}

struct Channel {
    sender: Sender<String>,
    _receiver: Receiver<String>
}

fn get_channel()->&'static Arc<Mutex<Channel>> {
    unsafe {
        INIT_CHANNEL.call_once(|| {
            let (sender, receiver) = async_channel::unbounded();
            CHANNEL = Some(Arc::new(Mutex::new(Channel { sender, _receiver: receiver })));
        });
        CHANNEL.as_ref().unwrap()        
    }
}

static INIT_CHANNEL: Once = Once::new();
static mut CHANNEL: Option<Arc<Mutex<Channel>>> = None;

fn get_watchers()->&'static Arc<Mutex<HashMap<String, DirWatcher>>> {
    unsafe {
        INIT_WATCHERS.call_once(|| {
            WATCHERS = Some(Arc::new(Mutex::new(HashMap::new())));
        });
        WATCHERS.as_ref().unwrap()        
    }
}

static INIT_WATCHERS: Once = Once::new();
static mut WATCHERS: Option<Arc<Mutex<HashMap<String, DirWatcher>>>> = None;
