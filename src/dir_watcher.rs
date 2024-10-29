use std::{collections::HashMap, path::Path, sync::{Arc, Mutex, Once}};

use async_channel::{Receiver, Sender};
use notify::{Event, EventHandler, INotifyWatcher, RecursiveMode, Watcher};

pub fn add_dir_watching(id: &str, path: &str) {
    let mut watchers = get_watchers().lock().unwrap();
    let channel = get_channel().lock().unwrap();
    let _ = watchers.insert(id.to_string(), DirWatcher::new(path, channel.sender.clone()));
    println!("inserted");
}

struct DirWatcher {
    _watcher: INotifyWatcher
}   

impl DirWatcher {
    pub fn new(path: &str, snd: Sender<String>)->Self {
        let handler = DirWatcherHandler { snd };
        let mut watcher = notify::recommended_watcher(handler).unwrap();        
        watcher.watch(Path::new(&path), RecursiveMode::NonRecursive).unwrap();
        Self {
            _watcher: watcher
        }
    }
}

#[derive(Clone)]
struct DirWatcherHandler {
    snd: Sender<String>
}
impl EventHandler for DirWatcherHandler {
    fn handle_event(&mut self, event: Result<Event, notify::Error>) {
        if let Ok(event) = event {
            println!("Event: {:?}", event);
            let _ = self.snd.send_blocking(format!("{:?}", event));
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
