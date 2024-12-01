use std::sync::{Mutex, OnceLock};

use gtk::prelude::*;
use gtk::Settings;

pub fn is_dark_theme() -> bool {
    fn retrieve_dark_theme() -> bool {
        let settings = Settings::default().expect("Failed to get default GtkSettings");
        settings.property::<bool>("gtk-application-prefer-dark-theme")
    }

    // Initialize DARK_THEME if it hasn't been already
    let dark_theme = DARK_THEME.get_or_init(|| Mutex::new(None));

    let mut dark_theme_lock = dark_theme.lock().unwrap();
    if dark_theme_lock.is_none() {
        *dark_theme_lock = Some(retrieve_dark_theme());

        let settings = Settings::default().expect("Failed to get default GtkSettings");
        let dark_theme_clone = DARK_THEME.get().unwrap();
        settings.connect_notify(Some("gtk-application-prefer-dark-theme"), move |_settings, _| {
            let new_value = retrieve_dark_theme();
            let mut dark_theme_lock = dark_theme_clone.lock().unwrap();
            *dark_theme_lock = Some(new_value);
        });
    }

    dark_theme_lock.unwrap_or_default()
}

static DARK_THEME: OnceLock<Mutex<Option<bool>>> = OnceLock::new();