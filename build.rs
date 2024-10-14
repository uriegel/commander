#[cfg(target_os = "linux")]    
fn main() {
    use glib_build_tools::compile_resources;

    compile_resources(
        &["resources"],
        "resources/resources.gresource.xml",
        "commander.gresource",
    );
}