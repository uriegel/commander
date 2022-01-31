use napi::Error;

#[derive(Debug)]
pub struct StringError {
    pub message: String
}

impl From<StringError> for Error {
    fn from(err: StringError) -> Error {
        Error::from_reason(err.message)
    }
}
