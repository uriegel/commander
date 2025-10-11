use std::{fs::File, io::BufReader};

use chrono::{Local, NaiveDateTime, TimeZone};
use exif::{In, Tag, Value};
use napi::{bindgen_prelude::AsyncTask, Task};
use napi_derive::napi;
use napi::bindgen_prelude::*;

#[napi(object)]
pub struct ExifDataInput {
    pub idx: i32,
    pub path: String
}

#[napi(object)]
pub struct ExifData {
    pub idx: i32,
    pub date_time: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

pub struct AsyncGetExifData {
    input: ExifDataInput
}

#[napi]
impl Task for AsyncGetExifData {
    type Output = ExifData;
    type JsValue = ExifData;
 
    fn compute(&mut self) -> Result<Self::Output> {
        Ok(get_exif_data(self.input.idx, self.input.path.clone()).unwrap_or_else(|| { ExifData {
            idx: 0,
            date_time: None,
            latitude: None,
            longitude: None
        }}))
    }
 
    fn resolve(&mut self, _: Env, output: ExifData) -> Result<Self::JsValue> {
        Ok(output)
    }
}

#[napi]
pub fn get_exif_data_async(input: ExifDataInput) -> AsyncTask<AsyncGetExifData> {
    AsyncTask::new(AsyncGetExifData { input })
}

fn get_exif_data(idx: i32, path: String) -> Option<ExifData> {
    let file = File::open(path).ok()?;
    let mut bufreader = BufReader::new(file);
    let exif_reader = exif::Reader::new();
    let exif = exif_reader.read_from_container(
        &mut bufreader)
            //.inspect_err(|e|println!("Error reading exif info: {}", e))
            .ok()?;
    let dt = exif.get_field(
        Tag::DateTimeOriginal, In::PRIMARY)
            .or_else(||exif.get_field(Tag::DateTime, In::PRIMARY));
    let date_time = dt.and_then(|v| {
        exif_value_to_iso8601_utc(&v.value)    
    });
    
    let l = exif.get_field(Tag::GPSLatitude, In::PRIMARY);
    let latitude = l.and_then(|l| if let exif::Value::Rational(vec) = &l.value {
        gps_to_decimal(vec)
    } else { None });

    let l = exif.get_field(Tag::GPSLongitude, In::PRIMARY);
    let longitude = l.and_then(|l| if let exif::Value::Rational(vec) = &l.value {
        gps_to_decimal(vec)
    } else { None });

    if date_time.is_some() || latitude.is_some() || longitude.is_some() {
        Some(ExifData {
            idx,
            date_time,
            latitude,
            longitude
        })
    } else {
        None
    }
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

fn exif_value_to_iso8601_utc(value: &Value) -> Option<String> {
    // Extract ASCII string from the Value
    let exif_str = match value {
        Value::Ascii(ref vec) if !vec.is_empty() => {
            String::from_utf8_lossy(&vec[0]).trim().to_string()
        }
        _ => return None,
    };

    // EXIF format: "YYYY:MM:DD HH:MM:SS"
    let naive = NaiveDateTime::parse_from_str(&exif_str, "%Y:%m:%d %H:%M:%S").ok()?;

    // Convert to UTC (no timezone info in EXIF — assume already UTC)
    let datetime = Local.from_local_datetime(&naive).single()?;
    Some(datetime.to_rfc3339())
}