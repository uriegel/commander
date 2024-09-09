open System

[<EntryPoint>]
let main (args : string[]) =
    if args.Length = 0 then 
        WebView.run ()
    else
#if Windows    
        Elevated.runServer args[0]
#endif
        0
    
// TODO CreateDir
