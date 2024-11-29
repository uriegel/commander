#![allow(dead_code)]

use std::{any::TypeId, collections::HashMap, num::ParseIntError, str::Utf8Error, string::FromUtf8Error, sync::{MutexGuard, PoisonError, TryLockError}};

use quick_xml::DeError;
use serde::Serialize;
use serde_repr::Serialize_repr;
use webview_app::request::get_output;

use crate::cancellations::CancellationKey;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestError {
    pub status: ErrorType,
    //status_text: String
}

impl RequestError {
    pub fn unknown()->Self {
        Self {status: ErrorType::Unknown }
    }
}

#[derive(Debug, PartialEq, Serialize_repr)]
#[repr(u32)]
pub enum ErrorType {
    Unknown = 0,
    AccessDenied = 1,
    AlreadyExists = 2,
    FileNotFound = 3,
    // DeleteToTrashNotPossible,
    // NetNameNotFound,
    // PathNotFound,
    NotSupported = 7,
    // PathTooLong,
    Cancelled = 9,
    // WrongCredentials,
    NoDiskSpace = 11,
    OperationInProgress,
    ConnectionRefused = 14,
    // UacNotStarted = 1099
}

pub fn from_result<T>(result: Result<T, RequestError>)->String 
where T: Serialize + 'static, {
    match result {
        Ok(_) if (TypeId::of::<()>() == TypeId::of::<T>()) => get_output(&ItemsResult { ok: Empty {} }),
        Ok(ok) => get_output(&ItemsResult { ok }),
        Err(err) => get_output(&ItemsErrorResult { err }),
    }
}

impl From<std::io::Error> for RequestError {
    fn from(error: std::io::Error) -> Self {
        eprintln!("io.error: {error}");
        let status = match error.kind() {
            std::io::ErrorKind::PermissionDenied => ErrorType::AccessDenied,
            std::io::ErrorKind::AlreadyExists => ErrorType::AlreadyExists,
            std::io::ErrorKind::NotFound => ErrorType::FileNotFound,
            std::io::ErrorKind::OutOfMemory => ErrorType::NoDiskSpace,
            std::io::ErrorKind::Unsupported => ErrorType::NotSupported,
            std::io::ErrorKind::ConnectionRefused => ErrorType::ConnectionRefused,
            _ => ErrorType::Unknown
        };
        RequestError {
            status
        }
    }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
}

impl From<DeError> for RequestError {
    fn from(error: DeError) -> Self {
        eprintln!("Deserialize error: {error}");
        RequestError { status: ErrorType::Unknown }
    }
}

impl From<PoisonError<MutexGuard<'_, HashMap<CancellationKey, std::sync::mpsc::Sender<bool>>>>> for RequestError {
    fn from(error: PoisonError<MutexGuard<'_, HashMap<CancellationKey, std::sync::mpsc::Sender<bool>>>>) -> Self {
        eprintln!("Error occured while acquiring lock: {error}");
        RequestError { status: ErrorType::Unknown }
    }
}

impl From<serde_json::Error> for RequestError {
    fn from(error: serde_json::Error) -> Self {
        eprintln!("JSON error occured: {error}");
        RequestError { status: ErrorType::Unknown }
    }
}

impl From<FromUtf8Error> for RequestError {
    fn from(error: FromUtf8Error) -> Self {
        eprintln!("FromUtf8 error occured: {error}");
        RequestError { status: ErrorType::Unknown }
    }
}

impl From<Utf8Error> for RequestError {
    fn from(error: Utf8Error) -> Self {
        eprintln!("Utf8 error occured: {error}");
        RequestError { status: ErrorType::Unknown }
    }
}

impl From<trash::Error> for RequestError {
    fn from(error: trash::Error) -> Self {
        eprintln!("trash::Error: {error}");
        let status = match &error {
            #[cfg(target_os = "linux")]
            trash::Error::FileSystem { source, .. } if source.kind() == std::io::ErrorKind::PermissionDenied => ErrorType::AccessDenied,
            #[cfg(target_os = "linux")]
            trash::Error::FileSystem { source, .. } if source.kind() == std::io::ErrorKind::NotFound => ErrorType::FileNotFound,
            #[cfg(target_os = "windows")]
            trash::Error::Os { code, .. } if *code as u32 == 0x80070002 => ErrorType::FileNotFound,
            _ => ErrorType::Unknown,
        };
        RequestError {
            status
        }
    }
}

impl From<TryLockError<MutexGuard<'static, bool>>> for RequestError {
    fn from(error: TryLockError<MutexGuard<'static, bool>>) -> Self {
        eprintln!("TryLockError: {error}");
        RequestError {
            status: ErrorType::OperationInProgress
        }
    }
}

impl From<ParseIntError> for RequestError {
    fn from(error: ParseIntError) -> Self {
        eprintln!("ParseIntError: {error}");
        Self {
            status: ErrorType::Unknown
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ItemsResult<T> {
    ok: T
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ItemsErrorResult {
    err: RequestError
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Empty {}