open Configuration
open Theme

Server.start ()

let private getIconScript = 
    let filename = saveResource (getElectronFile "geticon.py", "python/geticon.py")
    let getIconScript () = filename
    getIconScript    

async {
    let args = sprintf "%s %s" (getIconScript ()) "sample.html"
    let! affe = FSharpTools.Process.runCmd "python3" args
    printfn "affe %s" affe
} |> Async.RunSynchronously


startThemeDetection ()

async {
    do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
} |> Async.RunSynchronously
