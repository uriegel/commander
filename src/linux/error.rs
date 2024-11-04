use crate::request_error::{ErrorType, RequestError};

impl From<gtk::glib::Error> for RequestError {
    fn from(_error: gtk::glib::Error) -> Self {
        RequestError {
            status: ErrorType::Unknown                        
        }
    }
}
