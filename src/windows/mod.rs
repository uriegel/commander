use systemicons::get_icon;
use neon::prelude::*;

fn get_icon_async(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let ext = cx.argument::<JsString>(0)?.value(&mut cx);
    let size = cx.argument::<JsNumber>(1)?.value(&mut cx);
    let callback = cx.argument::<JsFunction>(2)?.root(&mut cx);

    let args = match get_icon(&ext, size as i32) {
        Ok(_buffer) => {
            let obj = cx.empty_object();
            let width = cx.number(800);
            let height = cx.number(600);
            obj.set(&mut cx, "width",  width)?;
            obj.set(&mut cx, "height",  height)?;
            vec![
                cx.null().upcast::<JsValue>(),
                obj.upcast(),
            ]
        }
        Err(_err) => {
            let err = cx.string("Could not get icon buffer");
            vec![
                err.upcast::<JsValue>(),
            ]            
        }
    };
    let this = cx.undefined();
    let callback = callback.into_inner(&mut cx);
    callback.call(&mut cx, this, args)?;
    //Ok(())        
    Ok(cx.undefined())
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getIcon", get_icon_async)?;
    Ok(())
}

