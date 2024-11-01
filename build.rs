use std::fs;
use std::path::Path;

#[cfg(target_os = "linux")]    
fn main() {
    use glib_build_tools::compile_resources;

    copy_marker_pngs();
    
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

fn copy_marker_pngs() {
    let src1 = Path::new("resources/marker-icon-2x.png");
    let src2 = Path::new("resources/marker-icon.png");
    let src3 = Path::new("resources/marker-shadow.png");
    let dst1 = Path::new("website/dist/marker-icon-2x.png");
    let dst2 = Path::new("website/dist/marker-icon.png");
    let dst3 = Path::new("website/dist/marker-shadow.png");

    fn copy(from: &Path, to: &Path) {
        if let Err(e) = fs::copy(from, to) {
            panic!("Error copying marker file: {}", e);
        } else {
            println!("Successfully copied {:?} to {:?}", from, to);
        }
    }

    copy(src1, dst1);
    copy(src2, dst2);
    copy(src3, dst3);
}