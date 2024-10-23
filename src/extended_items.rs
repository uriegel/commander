use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::requests::ItemsResult;

pub fn get_extended_items(input: GetExtendedItems)->ItemsResult<GetExtendedItemsResult> {
    ItemsResult {
        ok: GetExtendedItemsResult {
            path: input.path,
            exif_datas: input.items.iter().map(|i|None).collect()
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
    date_time: Option<DateTime<Utc>>,
    latitude: Option<f64>,
    longitude: Option<f64>,
}