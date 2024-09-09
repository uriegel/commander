open System

[<EntryPoint>]
let main (args : string[]) =
    if args.Length = 0 then 
        WebView.run ()
    else
        Elevated.runServer args[0]
        0
    
// TODO CreateDir
