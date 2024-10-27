pub trait StrExt {
    fn ext_is(&self, s: &str) -> bool;
}

impl StrExt for str {
    fn ext_is(&self, s: &str) -> bool {
        self
            .rfind('.')
            .map(|pos|self.split_at(pos))
            .inspect(|(_, ext)|println!("Erweiterung {}", *ext))
            .map(|(_, ext)|ext.eq_ignore_ascii_case(s))
            .unwrap_or(false)
    }
}



