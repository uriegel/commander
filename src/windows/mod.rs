use systemicons::get_icon;
use neon::prelude::*;

fn get_icon_async(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let ext = cx.argument::<JsString>(0)?.value(&mut cx);
    let size = cx.argument::<JsNumber>(1)?.value(&mut cx);
    let callback = cx.argument::<JsFunction>(2)?.root(&mut cx);

    let args = match get_icon(&ext, size as i32) {
        Ok(buffer) => {
            let mut js_buffer = cx.buffer(buffer.len() as u32)?;
            cx.borrow_mut(&mut js_buffer, |js_buffer| {
                let buf = js_buffer.as_mut_slice();
                buf.copy_from_slice(&buffer);
            });
        
            vec![
                cx.null().upcast::<JsValue>(),
                js_buffer.upcast(),
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
    Ok(cx.undefined())
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getIcon", get_icon_async)?;
    Ok(())
}

