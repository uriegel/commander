#[napi]
pub struct Folder {
    name: String
}

#[napi]
impl Folder {
    #[napi(constructor)]
    pub fn new() -> Self { Folder { name: "".to_string() }  }

    #[napi(getter)]
    pub fn get_name(&self) -> &str { self.name.as_str() }
  
    #[napi(setter)]
    pub fn set_name(&mut self, name: String) { self.name = name; }    
}