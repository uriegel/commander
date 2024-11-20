#[cfg(target_os = "linux")]    
fn main() {
    use glib_build_tools::compile_resources;
   
    compile_resources(
        &["resources"],
        "resources/resources.gresource.xml",
        "commander.gresource",
    );
}

#[cfg(target_os = "windows")]    
fn main() {
    copy_marker_pngs();

    static_vcruntime::metabuild();
    let mut res = winresource::WindowsResource::new();
    res.set_icon("resources/kirk.ico")
       .set_version_info(winresource::VersionInfo::PRODUCTVERSION, 0x0001000000000000);
    res.compile().unwrap();    
}