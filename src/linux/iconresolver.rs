use std::{fs, path::Path, sync::Once};

use crate::APP_ID;

pub fn get_geticon_py()->&'static str {
    unsafe {
        INIT.call_once(|| {
            GETICON_PY = Some(get_path());
        });
        GETICON_PY.as_ref().unwrap()        
    }
}

fn get_path()->String {
    let geticon_py = include_bytes!("../../resources/geticon.py");
    let home = std::env::var("HOME").expect("No HOME directory");
    let config_dir = Path::new(&home).join(".config").join(APP_ID);
    if !fs::exists(config_dir.clone()).expect("Could not access local directory") 
        { fs::create_dir(config_dir.clone()).expect("Could not create local directory") } 
    let path_app = config_dir.join("geticon.py");
    fs::write(path_app.clone(), geticon_py).unwrap();
    path_app.to_string_lossy().to_string()
}

static INIT: Once = Once::new();
static mut GETICON_PY: Option<String> = None;