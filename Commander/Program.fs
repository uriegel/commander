open Configuration
open Theme

Server.start ()

startThemeDetection ()

async {
    do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
} |> Async.RunSynchronously
