use std::{fmt::{Display, Formatter, Result}, string::FromUtf8Error};

#[derive(Debug)]
pub struct Error {
    message: String
}

impl Error {
    pub fn new(text: &str)->Self {
        Self {
            message: text.to_string()
        }
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result {
        write!(f, "{}", self.message)
    }
}

impl From<std::io::Error> for Error {
    fn from(error: std::io::Error) -> Self {
        Error {
            message: error.to_string(),
        }
    }
}

impl From<FromUtf8Error> for Error {
    fn from(error: FromUtf8Error) -> Self {
        Error {
            message: error.to_string(),
        }
    }
}

#[cfg(target_os = "windows")]
impl From<systemicons::Error> for Error {
    fn from(error: systemicons::Error) -> Self {
        Error {
            message: error.message,
        }
    }
}
