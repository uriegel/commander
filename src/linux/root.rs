use std::{iter::Take, process::Command};

use serde::Serialize;

use crate::request_error::RequestError;

#[derive(Debug)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RootItem {
    pub name: String,
    pub size: usize,
    pub description: String,
    pub mount_point: String,
    pub is_mounted: bool,
    pub drive_type: String,
}

pub fn get_root()->Result<Vec<RootItem>, RequestError> {
    let output = Command::new("lsblk")
        .arg("--bytes")
        .arg("--output")
        .arg("SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE")
        .output()?;
    if output.status.success() {
        let lines = String::from_utf8(output.stdout)?;
        let lines = lines.lines().collect();
        let lines: Vec<&str> = lines;
        let first_line = lines[0];
        
        let column_positions = [
            0u16, 
            get_part(first_line, "NAME"),
            get_part(first_line, "LABEL"),
            get_part(first_line, "MOUNT"),
            get_part(first_line, "FSTYPE")
        ];
    
        let root_items = lines
            .iter()
            .skip(1)
            .map(|n| {
                let name = get_string(column_positions, n, 1, Some(2));
                match name.bytes().next() {
                    Some(b) if b > 127 => {
                        let description = get_string(column_positions, n, 2, Some(3));
                        let mount_point = get_string(column_positions, n, 3, Some(4));
                        let size = match str::parse::<usize>(&get_string(column_positions, n, 0, Some(1))) {
                            Ok(val) => val,
                            _ => 0
                        };
                        let drive_type = get_string(column_positions, n, 4, None);
                        let is_mounted = mount_point.len() > 0;
                        Some(RootItem { name: name[6..].to_string(), description, mount_point, size, drive_type, is_mounted })
                    },
                    _ => None
                }
            })
            .filter_map(|item| item);
        let mut items: Vec<RootItem> = 
            [
                RootItem {
                    name: "~".to_string(),
                    size: 0,
                    description: "home".to_string(),
                    mount_point: dirs::home_dir().unwrap().to_str().unwrap().to_string(),
                    drive_type: "".to_string(),
                    is_mounted: true
                }
            ]
            .into_iter()
            .chain(root_items)
            .collect();
        items.sort_by(|a, b| {
            b.is_mounted.cmp(&a.is_mounted)
                .then(get_root_sort_name(&a.name).cmp(get_root_sort_name(&b.name)))
        });
        Ok(items)
    } else {
        Err(RequestError::unknown())
    }
}

fn get_part(first_line: &str, key: &str)->u16 {
    match first_line.match_indices(key).next() {
        Some((index, _)) => index as u16,
        None => 0
    }
}

fn get_string(column_positions: [u16; 5], line: &str, pos1: usize, pos2: Option<usize>)->String {
    let index = column_positions[pos1] as usize;
    let len = match pos2 {
        | Some(pos) => Some(column_positions[pos] as usize - index),
        | None => None
    }; 
    let result: String = line
        .chars()
        .into_iter()
        .skip(index)
        .take_option(len)
        .collect();
    result
        .trim()
        .to_string()
}

fn get_root_sort_name(name: &str)->&str {
    if name == "~" {
        "aaa"
    } else {
        name
    }
}

trait _IteratorExt: Iterator {

    fn take_option(self, n: Option<usize>) -> Take<Self>
        where
            Self: Sized {
        match n {
            Some(n ) => self.take(n),
            None => self.take(usize::MAX)
        }
    }
}
impl<I: Iterator> _IteratorExt for I {}