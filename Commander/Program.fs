open Configuration

Server.start ()

async {
    do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
} |> Async.RunSynchronously


// TODO Show Fullscreen
// TODO Autohide menu (and save it in localStorage)


