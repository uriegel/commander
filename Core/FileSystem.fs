module FileSystem

open FSharpRailway
open FSharpTools
open System

type IOError = 
| AccessDenied
| AlreadyExists
| FileNotFound
| DeleteToTrashNotPossible
| Exception of string

let mapIOError (e: exn) = 
    match e with
    | :? UnauthorizedAccessException -> AccessDenied
    | e when e.HResult = 13          -> AccessDenied
    | e when e.HResult = -2146232800 -> AlreadyExists
    | e                              -> Exception e.Message

let checkExistsDirectory path = 
    let info = IO.FileInfo path
    if not info.Directory.Exists then 
        Directory.create info.DirectoryName |> ignore
    path

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

type Error = {
    Error: IOError option
}

let getError err = {
    Error = err
}

let moveFile (path: string) (newPath: string) = 
    IO.Directory.Move (path, newPath)