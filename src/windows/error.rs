use crate::error::Error;

impl From<systemicons::Error> for Error {
    fn from(error: systemicons::Error) -> Self {
        Error {
            message: error.message,
        }
    }
}
