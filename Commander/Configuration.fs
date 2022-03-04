module Configuration

open FSharpTools.Functional
open System
open System.Text.Json
open System.Text.Encodings.Web;
open System.Text.Json.Serialization

open Utils

let getJsonOptions () = 
    // TODO memoize
    let getJsonOptions () = 
        let jsonOptions = JsonSerializerOptions()
        jsonOptions.PropertyNamingPolicy <- JsonNamingPolicy.CamelCase
        jsonOptions.Encoder <- JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        jsonOptions.Converters.Add(JsonFSharpConverter())
        jsonOptions
    let options = getJsonOptions ()
    options

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
