use crate::request_error::{ErrorType, RequestError};

impl From<windows_result::Error> for RequestError {
    fn from(error: windows_result::Error) -> Self {
        let status =
            match error.code().0 as u32 {
                0x80070002 => ErrorType::FileNotFound,
                0x80070005 => ErrorType::AccessDenied,
                _ => ErrorType::Unknown                        
            };
        RequestError {
            status
        }
    }
}
