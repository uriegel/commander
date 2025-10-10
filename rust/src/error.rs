use std::io;

use napi::bindgen_prelude::*;

pub enum AddonError {
    NapiError(Error<Status>),
    IOError((i32, String)),
    GeneralError((i32, String))
}

impl AsRef<str> for AddonError {
	fn as_ref(&self) -> &str {
		match self {
			AddonError::IOError((_, str)) => str,
			AddonError::GeneralError((_, str)) => str,
			AddonError::NapiError(e) => e.status.as_ref(),
		}
	}
}

impl From<io::Error> for AddonError {
    fn from(err: io::Error) -> Self {
		match err.raw_os_error() {
			Some(13) => AddonError::IOError((3, "Zugriff verweigert".to_string())),
			Some(2) => AddonError::IOError((2, "Datei oder Verzeichnis nicht gefunden".to_string())),
			_ => AddonError::IOError((1, "Allgemeiner IO Fehler".to_string()))
		}
    }
}

impl From<AddonError> for Error {
    fn from(err: AddonError) -> Error {
        match err {
            AddonError::NapiError(e) => e,
            AddonError::IOError((code,str)) => Error::new(Status::InvalidArg, format!("{}$${}", code, str)),
            AddonError::GeneralError((code,str)) => Error::new(Status::InvalidArg, format!("{}$${}", code, str))
        }    
    }
}
