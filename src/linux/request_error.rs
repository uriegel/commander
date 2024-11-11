use gtk::{gio::IOErrorEnum, glib::FileError};

use crate::request_error::{ErrorType, RequestError};

impl From<gtk::glib::Error> for RequestError {
    fn from(error: gtk::glib::Error) -> Self {
        let status = 
            if let Some(file_error) = error.kind::<FileError>() {
                match file_error {        
                    _ => ErrorType::Unknown
                }
            }
            else if let Some(io_error) = error.kind::<IOErrorEnum>() {
                match io_error {        
                    IOErrorEnum::NotFound => ErrorType::FileNotFound,
                    IOErrorEnum::PermissionDenied => ErrorType::AccessDenied,
                    IOErrorEnum::Cancelled => ErrorType::Cancelled,
                    _ => ErrorType::Unknown
                }
            } else {
                ErrorType::Unknown
            };
        RequestError {
            status
        }
    }
}
