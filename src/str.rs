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



