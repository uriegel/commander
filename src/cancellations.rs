use std::{collections::HashMap, sync::{mpsc::Sender, Arc, Mutex, OnceLock}};

use crate::request_error::RequestError;

#[derive(Hash, Eq, PartialEq, Debug)]
pub enum CancellationType {
    ExtendedItem,
    Copy
}

#[derive(Hash, Eq, PartialEq, Debug)]
pub struct CancellationKey {
    id: Option<String>,
    cancellation_type: CancellationType
}

pub fn reset(id: Option<String>, cancellation_type: CancellationType, sender: Sender<bool>) {
    let mut cancellation = get().lock().unwrap();
    let _ = cancellation.insert(CancellationKey { id, cancellation_type }, sender);
}

pub fn cancel(id: Option<&str>, cancellation_type: CancellationType)->Result<(), RequestError> {
    let cancellation = get().lock()?;
    let cancel = cancellation.get(&CancellationKey {
        id: id.map(|s|s.to_string()), cancellation_type
    });
    cancel.inspect(|snd|{let _ = snd.send(true);});
    Ok(())
}

fn get()->&'static Arc<Mutex<HashMap<CancellationKey, Sender<bool>>>> {
    CANCELLATION.get_or_init(||Arc::new(Mutex::new(HashMap::new())))
}

static CANCELLATION: OnceLock<Arc<Mutex<HashMap<CancellationKey, Sender<bool>>>>> = OnceLock::new();
