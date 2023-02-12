module CommanderCore

open FSharpTools
open FSharpTools.Functional
open System


type Platform =
    | Kde     = 0
    | Gnome   = 1
    | Windows = 2

#if Linux 
let getPlatform = 
    let getPlatform () = 
        let session =         
            "DESKTOP_SESSION"
            |> String.retrieveEnvironmentVariable 
            |> Option.defaultValue ""

        match session with
        | "plasmawayland" -> Platform.Kde
        | "plasma"        -> Platform.Kde
        | _               -> Platform.Gnome

    getPlatform |> memoizeSingle
#endif

#if Windows 

let getPlatform () = Platform.Windows

#endif