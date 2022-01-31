#[macro_use]
extern crate napi_derive;

// use chrono::{Local, NaiveDateTime, TimeZone};
// use exif::{In, Tag};
// use lexical_sort::natural_lexical_cmp;
// use neon::prelude::*;
// use std::{ fs, fs::File, io::BufReader, time::UNIX_EPOCH };

// #[cfg(target_os = "linux")]
// use crate::linux::is_hidden;
// #[cfg(target_os = "windows")]
// use crate::windows::is_hidden;

#[cfg(target_os = "linux")]
//use crate::linux::init_addon;
#[cfg(target_os = "windows")]
use crate::windows::init_addon;

// #[cfg(target_os = "linux")]
// mod linux;

// #[cfg(target_os = "windows")]
// mod windows;

// TODO: create class Folder
#[napi]
pub fn test(a: String, b: String) -> String {
    format!("{a} und {b}")
}