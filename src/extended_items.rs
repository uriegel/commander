use std::{fs::File, io::BufReader, path::PathBuf, sync::mpsc::Receiver};

use chrono::{DateTime, Local, TimeZone};
use exif::{Field, In, Tag, Value};
use serde::{Deserialize, Serialize};

use crate::{cancellations::get_cancellation, requests::{Empty, ItemsResult}};

pub fn get_extended_items(input: GetExtendedItems, cancel: Receiver<bool>)->ItemsResult<GetExtendedItemsResult> {
    let path = input.path.clone(); 
    ItemsResult {
        ok: GetExtendedItemsResult {
            path,
            extended_items: input
                            .items
                            .iter()
                            .take_while(|_|!cancel.try_recv().ok().unwrap_or(false))
                            .map(|n| ExtendedItem { 
                                                exif_data: get_exif_data(&input, n),
                                                version: None
                                            })
                            .collect()
        }
    }
}

pub fn cancel_extended_items(input: CancelExtendedItems)->ItemsResult<Empty> {
    let cancellation = get_cancellation().lock().unwrap();
    let snd = cancellation.as_ref();
    snd.inspect(|snd|{let _ = snd.send(true);});
    ItemsResult {
        ok: Empty {}
    }
}

fn get_exif_data(input: &GetExtendedItems, item: &String) -> Option<ExifData> {
    let lower_item = item.to_lowercase();
    if lower_item.ends_with(".jpg") || lower_item.ends_with(".png") {
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
            .inspect_err(|e|println!("Error reading exif info: {}", e))
            .ok()?;
    let dt = exif.get_field(
        Tag::DateTimeOriginal, In::PRIMARY)
            .or_else(||exif.get_field(Tag::DateTime, In::PRIMARY));
    let date_time = dt.and_then(|v| v.to_date_time());
    date_time.map(|date_time|ExifData { date_time: Some(date_time), latitude: None, longitude: None })
        // TODO
        //Tag::GPSDestLongitude
        //Tag::GPSDestLatitude
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

