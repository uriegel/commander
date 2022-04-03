module PlatformConfiguration
open FSharpTools 

open Configuration

let getPlatform () = 
    let session =         
        "DESKTOP_SESSION"
        |> String.retrieveEnvironmentVariable 
        |> Option.defaultValue ""

    match session with
    | "plasmawayland" -> Platform.Kde
    | "plasma"        -> Platform.Kde
    | _               -> Platform.Gnome


