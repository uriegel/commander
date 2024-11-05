use crate::request_error::{ErrorType, RequestError};

impl From<windows_result::Error> for RequestError {
    fn from(error: windows_result::Error) -> Self {
        // TODO map error
        RequestError {
            status: ErrorType::Unknown                        
        }
    }
}
