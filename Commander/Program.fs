open FSharpTools

printfn "Hello Commander"


let file = System.IO.Path.GetTempFileName()


let assembly = System.Reflection.Assembly.GetEntryAssembly ()
let resources = assembly.GetManifestResourceNames ()
let stream = assembly.GetManifestResourceStream "electron/main.js"
let feile = System.IO.File.OpenWrite file
stream.CopyTo feile
stream.Flush ()
feile.Close ()



async {
    do! Electron.start file
} |> Async.RunSynchronously

//TODO unpack to .config/uriegel.de/commander
//TODO Start electron .config/uriegel.de/commander/main.js
//TODO index and css and styles in Resource, served by Giraffe
//TODO Start electron with environment x=23 y=45 w=234 h=234 isMaximized
//TODO Windows and Linux
//TODO typescript renderer script


