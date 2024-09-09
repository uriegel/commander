open System

[<EntryPoint>]
let main (args : string[]) =
    if args.Length = 0 then 
        WebView.run ()
    else
        Elevated.runServer args[0]
        0
    
// TODO Delete: mapError (Access denied)
// TODO CreateDir

// TODO UAC: call Commander with params:
//              start program (Windows shellexecute, Linux runCmd)    
//              GetParams from binary utf8 stream (Windows?)
//              GetResult to binary utf8 stream
//              GetEvents to binary utf8 stream