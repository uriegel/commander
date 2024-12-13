use std::sync::OnceLock;

pub fn get_hwnd()->isize {
    *HWND.get().unwrap()
}

pub fn set_hwnd(hwnd: isize) {
    let _ = HWND.get_or_init(||hwnd);
}

static HWND: OnceLock<isize> = OnceLock::new();