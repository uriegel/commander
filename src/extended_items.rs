use std::{fs::File, io::BufReader, path::PathBuf};

use exif::{DateTime, In, Tag, Value};
use serde::{Deserialize, Serialize};

use crate::requests::ItemsResult;

pub fn get_extended_items(input: GetExtendedItems)->ItemsResult<GetExtendedItemsResult> {
    fn get_exif_data(input: &GetExtendedItems, item: &String) -> Option<ExifData> {
        let lower_item = item.to_lowercase();
        if lower_item.ends_with(".jpg") || lower_item.ends_with(".png") {
            exif_data(&PathBuf::from(&input.path).join(item))
        } else {
            None            
        }
    }

    fn exif_data(file: &PathBuf)->Option<ExifData> {
        let file = File::open(file).inspect_err(|e|println!("Error opening img file: {}", e)).ok()?;
        let mut bufreader = BufReader::new(file);
        let exif_reader = exif::Reader::new();
        let exif = exif_reader.read_from_container(&mut bufreader).inspect_err(|e|println!("Error reading exif info: {}", e)).ok()?;
        let dt = exif.get_field(Tag::DateTimeOriginal, In::PRIMARY).or_else(||exif.get_field(Tag::DateTime, In::PRIMARY));
        dt.and_then(|v| {
            match v.value {
                Value::Ascii(ref vec) if !vec.is_empty() => {
                    let test = DateTime::from_ascii(&vec[0]).ok().inspect(|t|println!("Exif: {:?}", t));
                    let dt = exif.get_field(Tag::OffsetTime, In::PRIMARY);
                    dt.inspect(|d|println!("Offset: {:?}", d));
                    None
                },
                _ => None
            }
            // TODO
            //Tag::OffsetTime
            //Tag::GPSDestLongitude
            //Tag::GPSDestLatitude
        })
    }

    let path = input.path.clone(); 
    ItemsResult {
        ok: GetExtendedItemsResult {
            path,
            exif_datas: input
                            .items
                            .iter()
                            .map(|n| get_exif_data(&input, n))
                            .collect()
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetExtendedItemsResult {
    pub exif_datas: Vec<Option<ExifData>>,
    pub path: String
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
pub struct ExifData {
    date_time: Option<String>,
    latitude: Option<f64>,
    longitude: Option<f64>,
}