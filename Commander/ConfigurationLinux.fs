module PlatformConfiguration
open FSharpTools 

open Configuration
open Functional

let getPlatform = 
    let getPlatform () = 
        let session =         
            "DESKTOP_SESSION"
            |> String.retrieveEnvironmentVariable 
            |> Option.defaultValue ""

        printfn "Wailand"

        match session with
        | "plasmawayland" -> Platform.Kde
        | "plasma"        -> Platform.Kde
        | _               -> Platform.Gnome

    getPlatform |> memoizeSingle
