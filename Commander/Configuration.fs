module Configuration

open FSharpTools.Functional
open System

open Utils

let retrieveConfigDirectory application = combine3Pathes (Environment.GetFolderPath Environment.SpecialFolder.ApplicationData) "uriegel.de" application
let getConfigDirectory = memoize retrieveConfigDirectory
let getElectronFile = combine3Pathes (getConfigDirectory "commander") "electron" 
    
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
