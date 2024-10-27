use std::{fs::File, io::BufReader};

use serde::Deserialize;

use crate::requests::{Empty, ItemsResult};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTrackInfo {
    path: String
}

pub fn get_track_info(input: GetTrackInfo)->ItemsResult<Empty> {
    println!("GTI {}", input.path);
    let file = File::open(input.path).unwrap();
    println!("Xml opened");
    let buf_reader = BufReader::new(file);
    let info: XmlTrackInfo = quick_xml::de::from_reader(buf_reader).unwrap();
    println!("Xml: {:?}" , info);
    ItemsResult {
        ok: Empty {}
    }
}

#[derive(Debug, Deserialize)]
struct XmlTrackInfo {
    trk: Option<XmlTrack>,
}

#[derive(Debug, Deserialize)]
struct XmlTrack {
    name: Option<String>,
    desc: Option<String>,
    info: Option<XmlInfo>
}

#[derive(Debug, Deserialize)]
struct XmlInfo {
    date: Option<String>,
    distance: Option<f64>,
    duration: Option<i32>,
    averageSpeed: Option<f64>
}