use std::{collections::HashMap, sync::{mpsc::Sender, Arc, Mutex, Once}};

pub fn get_cancellation()->&'static Arc<Mutex<HashMap<CancellationKey, Sender<bool>>>> {
    unsafe {
        INIT.call_once(|| {
            CANCELLATION = Some(Arc::new(Mutex::new(HashMap::new())));
        });
        CANCELLATION.as_ref().unwrap()        
    }
}

#[derive(Hash, Eq, PartialEq, Debug)]
pub struct CancellationKey {
    id: String,
    cancellation_type: CancellationType
}

impl CancellationKey {
    pub fn extended_item(id: String)->Self {
        CancellationKey {
            id, cancellation_type: CancellationType::ExtendedItem
        }
    } 
}

#[derive(Hash, Eq, PartialEq, Debug)]
enum CancellationType {
    ExtendedItem
}

static INIT: Once = Once::new();
static mut CANCELLATION: Option<Arc<Mutex<HashMap<CancellationKey, Sender<bool>>>>> = None;
