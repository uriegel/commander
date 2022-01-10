use systemicons::get_icon;
use neon::prelude::*;

// static THREAD_POOL: Lazy<ThreadPool> = Lazy::new(|| {
//     ThreadPool::new(4)
// });

pub fn is_hidden(name: &str)->bool {
    false
}

pub fn init_addon(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getIcon", get_icon_async)?;
    Ok(())
}

fn get_icon_async(mut cx: FunctionContext) -> JsResult<JsUndefined> {

    let ext = cx.argument::<JsString>(0)?.value(&mut cx);
    let size = cx.argument::<JsNumber>(1)?.value(&mut cx);
    let callback = cx.argument::<JsFunction>(2)?.root(&mut cx);
    let channel = cx.channel();
    
    std::thread::spawn(move || {
        let result = get_icon(&ext, size as i32);
        channel.send(move |mut cx| {
            let args = match result {
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
            Ok(())
        });
    });
    Ok(cx.undefined())
}

