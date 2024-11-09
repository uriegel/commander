#[derive(Default, Clone, Copy)]
pub struct ProgressFiles<'a> {
    pub index: u32,
    #[allow(dead_code)]
    pub file: &'a str,
    current_bytes: u64,
    current_size: u64,
    // TODO timestamp last conztol updated
}

impl<'a> ProgressFiles<'a> {
    pub fn get_current_bytes(&self)->u64 {
        self.current_bytes - self.current_size
    }

    pub fn get_next(&self, file: &'a str, file_size: u64)->Self {
        ProgressFiles { 
            index: self.index + 1, 
            file, 
            current_bytes: self.current_bytes + file_size,  
            current_size: file_size,
        }        
    }
}


