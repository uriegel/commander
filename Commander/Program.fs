open FSharpTools 

open Configuration
open Process
open Theme

let session = 
    "DESKTOP_SESSION"
    |> String.retrieveEnvironmentVariable 
    |> Option.defaultValue ""
printfn "desktop %s" session // plasmawayland, plasma, gnome

Server.start ()

startThemeDetection ()

async {
    do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
} |> Async.RunSynchronously
