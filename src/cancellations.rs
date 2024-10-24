use std::sync::{mpsc::Sender, Arc, Mutex, Once};

pub fn get_cancellation()->&'static Arc<Mutex<Option<Sender<bool>>>> {
    unsafe {
        INIT.call_once(|| {
            CANCELLATION = Some(Arc::new(Mutex::new(None)));
        });
        CANCELLATION.as_ref().unwrap()        
    }
}

static INIT: Once = Once::new();
static mut CANCELLATION: Option<Arc<Mutex<Option<Sender<bool>>>>> = None;
