module Utils

open FSharpRailway
open FSharpTools
open Functional
open System

let retrieveConfigDirectory = Directory.retrieveConfigDirectory "uriegel.de"
let getConfigDirectory = memoize retrieveConfigDirectory

let checkExistsDirectory path = 
    let info = IO.FileInfo path
    if not info.Directory.Exists then 
        Directory.create info.DirectoryName |> ignore
    path

type IOError = 
| AccessDenied
| AlreadyExists
| Exception of System.Exception

let mapIOError (e: exn) = 
    match e with
    | :? System.UnauthorizedAccessException -> AccessDenied
    | e                                     -> Exception e

open Result

let createStream = Stream.create >> throw
let openReadStream = Stream.openRead >> throw

let securedCreateStream = checkExistsDirectory >> createStream
let securedOpenStream = checkExistsDirectory >> openReadStream

open Option

let getExtension file =
    let getExtensionIndex () = file |> String.lastIndexOfChar '.'
    let getExtensionFromIndex index = Some (file |> String.substring index)
    let getExtension = getExtensionIndex >=> getExtensionFromIndex
    getExtension ()

open Async

let runCmd cmd args = 
    let getStringFromResult (result: Process.ProcessResult) = async { return result.Output.Value } 
    let runCmd () = Process.run cmd args
    runCmd >> getStringFromResult



