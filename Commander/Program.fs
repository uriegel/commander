open System
open FSharpTools.Functional

let tee f x = 
    f x
    x
let takeFirstTupleElem (a, _) = a
let combine2Pathes path1 path2 = IO.Path.Combine (path1, path2)
let combine3Pathes path1 path2 path3 = IO.Path.Combine (path1, path2, path3)
let retrieveConfigDirectory application = combine3Pathes (Environment.GetFolderPath Environment.SpecialFolder.ApplicationData) "uriegel.de" application
let getConfigDirectory = memoize retrieveConfigDirectory
let getElectronFile = combine3Pathes (getConfigDirectory "commander") "electron" 
    
let openStream path : IO.Stream = IO.File.OpenWrite path
let checkDirectory path = 
    let info = IO.FileInfo path
    if not info.Directory.Exists then 
        IO.Directory.CreateDirectory info.DirectoryName |> ignore
    path
let securedOpenStream = checkDirectory >> openStream
let copyStream (target: IO.Stream, source: IO.Stream) = 
    source.CopyTo target
    source.Flush ()
    target.Close ()

let getResource resourcePath = 
    let assembly = Reflection.Assembly.GetEntryAssembly ()
    assembly.GetManifestResourceStream resourcePath

let getFileAndResourceStreams (getFileStream: string->IO.Stream) (getResourceStream: string->IO.Stream) (filePath, resourcePath) =
    (getFileStream filePath, getResourceStream resourcePath)

let saveResource = tee (getFileAndResourceStreams securedOpenStream getResource >> copyStream) >> takeFirstTupleElem

async {
    do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
} |> Async.RunSynchronously

//TODO index and css and styles in Resource, served by Giraffe
//TODO Start electron with environment x=23 y=45 w=234 h=234 isMaximized
//TODO Windows: not "electron", but full path to "electron.exe"
//TODO typescript renderer script


