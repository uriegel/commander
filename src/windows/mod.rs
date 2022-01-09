use systemicons::get_icon;
use neon::prelude::*;

fn get_icon_buffer(mut cx: FunctionContext) -> JsResult<JsString> {
    let ext = cx.argument::<JsString>(0)?.value(&mut cx);
    let size = cx.argument::<JsNumber>(1)?.value(&mut cx);

//    let path = get_icon_as_file(&ext, size as i32).unwrap_or(String::from(""));
    let path = "Hallo";
    Ok(cx.string(&path))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getIcon", get_icon_buffer)?;
    Ok(())
}

