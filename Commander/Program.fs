Server.start ()

async {
    //do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
    do! Electron.start "http://localhost:9865"
} |> Async.RunSynchronously

//TODO Start electron with main.ts starting window
//TODO Start electron with environment x=23 y=45 w=234 h=234 isMaximized
//TODO typescript renderer script



