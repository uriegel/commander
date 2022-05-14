module Configuration

open FSharpTools 

open Functional

type Platform =
    | Kde     = 0
    | Gnome   = 1
    | Windows = 2

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


let appicon = "web/images/kirk.png"

let init () = (20000, true)
