use std::{fmt::{Display, Formatter, Result}, num::ParseIntError, string::FromUtf8Error};

use quick_xml::DeError;

#[derive(Debug)]
pub struct Error {
    pub message: String
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

impl From<DeError> for Error {
    fn from(error: DeError) -> Self {
        Error {
            message: error.to_string(),
        }
    }
}

impl From<ParseIntError> for Error {
    fn from(error: ParseIntError) -> Self {
        Error {
            message: error.to_string(),
        }
    }
}
