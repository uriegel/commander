#[allow(dead_code)]

pub trait StrExt {
    fn ext_is(&self, s: &str) -> bool;
    fn split_at_str<'a >(&'a self, pat: &'a str) -> Option<(&'a str, &'a str)>;
    fn substr_after<'a >(&'a self, pat: &'a str) -> Option<&'a str>;
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
}

pub trait SizeExt {
    fn byte_count_to_string(&self) -> String;
}

impl SizeExt for usize {
    fn byte_count_to_string(&self) -> String {
        fn to_string(s: usize)-> String {
            let gb = (s as f32 / (1024 * 1024 * 1024) as f32).floor();
            let mb = s % (1024 * 1024 * 1024); 
            if gb >= 1.0 {
                return format!("{},{} GB", gb, mb);
            }
            let mb2 = (s as f32 / (1024 * 1024) as f32).floor();
            let kb = s % (1024 * 1024); 
            if mb2 >= 1.0 {
                return format!("{},{} MB", mb2, kb);
            }
            let kb2 = (s as f32 / 1024 as f32).floor();
            let b = s % 1024; 
            if kb2 >= 1.0 {
                format!("{},{} KB", kb2, b)
            }
            else {
                format!("{} B", b)
            }
        } 

        // TODO ( ) and  GB, kB, B...
        let str = to_string(*self);
        let pos = str.len() - str.find(',').unwrap_or(str.len());
        if pos > 3 {
            str[0..str.len()-pos + 3].to_string()
        }
        else {
            str
        }
    }
}






