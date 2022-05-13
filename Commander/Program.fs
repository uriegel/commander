open Configuration

Server.start ()

Requests.startThemeDetection ()

async {
    do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
} |> Async.RunSynchronously


// TODO Test KDE theme 
// TODO Test Yaru theme
