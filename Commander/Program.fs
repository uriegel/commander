open Configuration

let (port, uiMode) = Plugin.init ()

Server.start port

if uiMode then
    Requests.startThemeDetection ()

    async {
        do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
    } |> Async.RunSynchronously
else
    Plugin.run ()

