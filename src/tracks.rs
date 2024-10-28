use std::{fs::File, io::BufReader};

use serde::{Deserialize, Serialize};

use crate::requests::ItemsResult;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTrackInfo {
    path: String
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackInfoData {
    name: Option<String>,
    description: Option<String>,
    distance: f64,
    duration: i32,
    average_speed: f64,
    average_heart_rate: i32,
    track_points: Option<Vec<TrackPoint>>
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TrackPoint {
    latitude: f64,
    longitude: f64,
    elevation: f64,
    time: Option<String>,
    heartrate: i32,
    velocity: f64
}

pub fn get_track_info(input: GetTrackInfo)->ItemsResult<TrackInfoData> {
    println!("GTI {}", input.path);
    let file = File::open(input.path).unwrap();
    println!("Xml opened");
    let buf_reader = BufReader::new(file);
    let info: XmlTrackInfo = quick_xml::de::from_reader(buf_reader).unwrap();
    let res = TrackInfoData {
        name: info.trk.clone().and_then(|i|i.name),
        description: info.trk.clone().and_then(|i|i.desc),
        distance: info.trk.clone().and_then(|i|i.info.and_then(|i|i.distance)).unwrap_or(0.0),
        duration: info.trk.clone().and_then(|i|i.info.and_then(|i|i.duration)).unwrap_or(0),
        average_speed: info.trk.clone().and_then(|i|i.info.and_then(|i|i.average_speed)).unwrap_or(0.0),
        average_heart_rate: 0, // TODO
        track_points: 
            info
            .trk
            .and_then(|i|i
                .trkseg
                .and_then(|i|i
                    .trkpt
                    .map(|pts|pts
                        .iter()
                        .map(|pt|TrackPoint {
                            longitude: pt.lon.unwrap_or(0.0),
                            latitude: pt.lat.unwrap_or(0.0),
                            elevation: 0.0,
                            velocity: pt.speed.unwrap_or(0.0),
                            heartrate: pt.heartrate.unwrap_or(0),
                            time: pt.time.clone()
                        }).collect()
                    )))
    };

    ItemsResult {
        ok: res
    }
}

#[derive(Debug, Deserialize)]
struct XmlTrackInfo {
    trk: Option<XmlTrack>,
}

#[derive(Debug, Clone, Deserialize)]
struct XmlTrack {
    name: Option<String>,
    desc: Option<String>,
    info: Option<XmlInfo>,
    trkseg: Option<XmlTrackSegment>}

#[derive(Debug, Clone, Deserialize)]
struct XmlInfo {
    //date: Option<String>,
    distance: Option<f64>,
    duration: Option<i32>,
    #[serde(rename = "averageSpeed")]
    average_speed: Option<f64>,
}

#[derive(Debug, Clone, Deserialize)]
struct XmlTrackSegment {
    trkpt: Option<Vec<XmlTrackPoint>>
}
    
#[derive(Debug, Clone, Deserialize)]
struct XmlTrackPoint{
    #[serde(rename = "@lat")]
    lat: Option<f64>,
    #[serde(rename = "@lon")]
    lon: Option<f64>,
    time: Option<String>,
    speed: Option<f64>,
    heartrate: Option<i32>
}    