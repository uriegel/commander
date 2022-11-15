module Configuration

open FSharpTools
open FSharpTools.Functional
open System
open System.Text.Encodings.Web;
open System.Text.Json
open System.Text.Json.Serialization

open FileSystem

let private getDateTime = 
    let startTime = System.DateTimeOffset.UtcNow
    let getDateTime () = startTime
    getDateTime

let getStartDateTime () = getDateTime ()

let retrieveConfigDirectory = Directory.retrieveConfigDirectory "uriegel.de"
let getConfigDirectory = memoize retrieveConfigDirectory

type WindowBounds = {
    X:           int option
    Y:           int option
    Width:       int
    Height:      int
    IsMaximized: bool option
    Icon:        string option
    Theme:       string option
    Frame:       bool option
}

let getJsonOptions = 
    let getJsonOptions () = 
        let jsonOptions = JsonSerializerOptions()
        jsonOptions.PropertyNamingPolicy <- JsonNamingPolicy.CamelCase
        jsonOptions.Encoder <- JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        jsonOptions.DefaultIgnoreCondition <- JsonIgnoreCondition.WhenWritingNull
        jsonOptions.Converters.Add(JsonFSharpConverter())
        jsonOptions
    memoizeSingle getJsonOptions

let getElectronFile file = 
    [| 
        getConfigDirectory "commander"
        "electron"
        file
    |] |> Directory.combinePathes 

let copyStream (target: IO.Stream, source: IO.Stream) = 
    source.CopyTo target
    source.Flush ()
    target.Close ()

let getResource resourcePath = 
    let assembly = Reflection.Assembly.GetEntryAssembly ()
    assembly.GetManifestResourceStream resourcePath

let getFileAndResourceStreams (getFileStream: string->IO.Stream) (getResourceStream: string->IO.Stream) (filePath, resourcePath) =
    (getFileStream filePath, getResourceStream resourcePath)

let saveResource = 
    let saveResource = 
        sideEffect (getFileAndResourceStreams securedCreateStream getResource >> copyStream) >> takeFirstTupleElem
    memoize saveResource 

