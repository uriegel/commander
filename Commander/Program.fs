open Configuration
open Theme

Server.start ()

startThemeDetection ()

async {
    do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
} |> Async.RunSynchronously

// TODO automatic theme controlling Windows 
// https://docs.microsoft.com/en-us/previous-versions/windows/desktop/regprov/registryvaluechangeevent