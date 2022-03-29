module Utils

open FSharpRailway.Option
open FSharpTools
open Functional
open Microsoft.AspNetCore.Http
open System

let retrieveConfigDirectory = Directory.retrieveConfigDirectory "uriegel.de"
let getConfigDirectory = memoize retrieveConfigDirectory

module Functional = 

    // FSharpRailway
    let tee f x = 
        f x
        x

    let takeFirstTupleElem (a, _) = a

// FSharpRailway
module Result = 
    let mapErrorToOption result = 
        match result with
        | Ok    _ -> None
        | Error u -> Some u

    let throw result = 
        match result with
        | Ok value -> value
        |Error exn -> raise exn

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

let createStream = Stream.create >> Result.throw
let openReadStream = Stream.openRead >> Result.throw

let securedCreateStream = checkExistsDirectory >> createStream
let securedOpenStream = checkExistsDirectory >> openReadStream

let getExtension file =
    let getExtensionIndex () = file |> String.lastIndexOfChar '.'
    let getExtensionFromIndex index = Some (file |> String.substring index)
    let getExtension = getExtensionIndex >=> getExtensionFromIndex
    getExtension ()

let runCmd cmd args = 
    // TODO from FSharpRailway
    let (>>) f g x = async {
            let! y = f x
            let! e = g y
            return e
        }
    let getStringFromResult (result: FSharpTools.Process.ProcessResult) = async { return result.Output.Value } 
    let runCmd () = FSharpTools.Process.run cmd args
    runCmd >> getStringFromResult



