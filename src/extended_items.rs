use std::{fs::File, io::BufReader, path::PathBuf, sync::mpsc::{channel, TryRecvError}};

use chrono::{DateTime, Local, TimeZone};
use exif::{Field, In, Tag, Value};
use serde::{Deserialize, Serialize};

use crate::{cancellations::{self, CancellationType}, request_error::RequestError};

#[cfg(target_os = "windows")]
use crate::windows::version::get_version;
#[cfg(target_os = "linux")]
use crate::linux::directory::get_version;

pub fn get_extended_items(input: GetExtendedItems)->Result<GetExtendedItemsResult, RequestError> {
    let (snd, rcv) = channel::<bool>();
    cancellations::reset(Some(input.id.clone()), CancellationType::ExtendedItem, snd);
    let path = input.path.clone(); 
    Ok(GetExtendedItemsResult {
        path,
        extended_items: input
                        .items
                        .iter()
                        .take_while(|_|match rcv.try_recv() {
                                    Err(TryRecvError::Empty) => true,
                                    _ => false
                                })
                        .map(|n| ExtendedItem { 
                                            exif_data: get_exif_data(&input, n),
                                            version: get_version(&input.path, n),
                                        })
                        .collect()
    })
}

pub fn cancel_extended_items(input: CancelExtendedItems)->Result<(), RequestError> {
    cancellations::cancel(Some(&input.id), CancellationType::ExtendedItem)?;
    Ok(())
}

fn get_exif_data(input: &GetExtendedItems, item: &String) -> Option<ExifData> {
    let lower_item = item.to_lowercase();
    if lower_item.ends_with(".jpg") || lower_item.ends_with(".png")|| lower_item.ends_with(".heic") {
        exif_data(&PathBuf::from(&input.path).join(item))
    } else {
        None            
    }
}

fn exif_data(file: &PathBuf)->Option<ExifData> {
    let file = File::open(file).ok()?;
    let mut bufreader = BufReader::new(file);
    let exif_reader = exif::Reader::new();
    let exif = exif_reader.read_from_container(
        &mut bufreader)
            //.inspect_err(|e|println!("Error reading exif info: {}", e))
            .ok()?;
    let dt = exif.get_field(
        Tag::DateTimeOriginal, In::PRIMARY)
            .or_else(||exif.get_field(Tag::DateTime, In::PRIMARY));
    let date_time = dt.and_then(|v| v.to_date_time());
    
    let l = exif.get_field(Tag::GPSLatitude, In::PRIMARY);
    let latitude = l.and_then(|l| if let exif::Value::Rational(vec) = &l.value {
        gps_to_decimal(vec)
    } else { None });

    let l = exif.get_field(Tag::GPSLongitude, In::PRIMARY);
    let longitude = l.and_then(|l| if let exif::Value::Rational(vec) = &l.value {
        gps_to_decimal(vec)
    } else { None });

    date_time.map(|date_time|ExifData { date_time: Some(date_time), latitude, longitude })
}

fn gps_to_decimal(rationals: &[exif::Rational]) -> Option<f64> {
    if rationals.len() >= 3 {
        let degrees = rationals[0].to_f64();
        let minutes = rationals[1].to_f64();
        let seconds = rationals[2].to_f64();
        Some(degrees + minutes / 60.0 + seconds / 3600.0)
    } else {
        None
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetExtendedItems {
    pub id: String,
    pub items: Vec<String>,
    pub path: String
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetExtendedItemsResult {
    pub extended_items: Vec<ExtendedItem>,
    pub path: String
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtendedItem {
    exif_data: Option<ExifData>,
    version: Option<Version>
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub build: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExifData {
    date_time: Option<DateTime<Local>>,
    latitude: Option<f64>,
    longitude: Option<f64>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelExtendedItems {
    id: String    
}

trait FieldExt {
    fn to_date_time(&self) -> Option<DateTime<Local>>;
}

impl FieldExt for Field {
    fn to_date_time(&self) -> Option<DateTime<Local>> {
        match self.value {
            Value::Ascii(ref vec) if !vec.is_empty() => {
                exif::DateTime::from_ascii(&vec[0])
                    .ok()
                    .and_then(|dt|Local.with_ymd_and_hms(dt.year.into(), dt.month.into(), dt.day.into(), 
                        dt.hour.into(), dt.minute.into(), dt.second.into()).single())
            },
            _ => None
        }
    }
}

