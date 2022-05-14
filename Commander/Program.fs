open Configuration

open System.Threading

let (port, uiMode) = init ()

Server.start port

if uiMode then
    Requests.startThemeDetection ()

    async {
        do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
    } |> Async.RunSynchronously
else
    // TODO Wait for main Commander to exit
    let mre = new ManualResetEvent false
    mre.WaitOne () |> ignore    

// TODO Test KDE theme 
// TODO Test Yaru theme
