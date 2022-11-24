open Configuration

let (port, uiMode) = Plugin.init ()

Server.start port

if uiMode then
    Requests.startThemeDetection ()

    (getElectronFile "main.js", "electron/main.js")
    |> saveResource
    |> Electron.start
    |> Async.RunSynchronously
else
    Plugin.run ()

