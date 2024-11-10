use gtk::prelude::*;
use gtk::Settings;

pub fn is_dark_theme() -> bool {
    fn retrieve_dark_theme() -> bool {
        let settings = Settings::default().expect("Failed to get default GtkSettings");
        settings.property::<bool>("gtk-application-prefer-dark-theme")
    }

    unsafe {
        if DARK_THEME.is_none() {
            DARK_THEME.replace(retrieve_dark_theme());

            let settings = Settings::default().expect("Failed to get default GtkSettings");
            settings.connect_notify(Some("gtk-application-prefer-dark-theme"), |_settings, _| {
                DARK_THEME.replace(retrieve_dark_theme());
            });            
        }
        DARK_THEME.unwrap_or_default()
    }
}

static mut DARK_THEME: Option<bool> = None;