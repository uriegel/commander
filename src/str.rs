#![allow(dead_code)]

pub trait StrExt {
    fn ext_is(&self, s: &str) -> bool;
    fn split_at_str<'a >(&'a self, pat: &'a str) -> Option<(&'a str, &'a str)>;
    fn substr_after<'a >(&'a self, pat: &'a str) -> Option<&'a str>;
    fn starts_with_ignore_case<'a >(&'a self, pat: &'a str) -> bool; 
}

impl StrExt for str {
    fn ext_is(&self, s: &str) -> bool {
        self
            .rfind('.')
            .map(|pos|self.split_at(pos))
            .map(|(_, ext)|ext.eq_ignore_ascii_case(s))
            .unwrap_or(false)
    }
    
    // // TODO split before and after pat?
    fn split_at_str<'a >(&'a self, pat: &'a str) -> Option<(&'a str, &'a str)> {
        self
            .find(pat)
            .map(|idx| self.split_at(idx))
    }

    fn substr_after<'a >(&'a self, pat: &'a str) -> Option<&'a str> {
        self.find(pat).map(|idx| &self[idx + pat.len()..])
    }

    fn starts_with_ignore_case<'a >(&'a self, pat: &'a str) -> bool {
        self.to_lowercase().starts_with(&pat.to_lowercase())
    }
}

pub trait SizeExt {
    fn byte_count_to_string(&self) -> String;
}

impl SizeExt for usize {
    fn byte_count_to_string(&self) -> String {
        fn to_string(s: usize)-> (String, String) {
            let gb = (s as f32 / (1024 * 1024 * 1024) as f32).floor();
            let mb = s % (1024 * 1024 * 1024); 
            if gb >= 1.0 {
                return (format!("{},{}", gb, mb), "GB".to_string());
            }
            let mb2 = (s as f32 / (1024 * 1024) as f32).floor();
            let kb = s % (1024 * 1024); 
            if mb2 >= 1.0 {
                return (format!("{},{}", mb2, kb), "MB".to_string());
            }
            let kb2 = (s as f32 / 1024 as f32).floor();
            let b = s % 1024; 
            if kb2 >= 1.0 {
                (format!("{},{}", kb2, b), "KB".to_string())
            }
            else {
                (format!("{}", b),"B".to_string())
            }
        } 

        let (str, unit) = to_string(*self);
        let pos = str.len() - str.find(',').unwrap_or(str.len());
        if pos > 3 {
            format!("({} {})", &str[0..str.len()-pos + 3], unit)
        }
        else {
            format!("({} {})", str, unit)
        }
    }
}






