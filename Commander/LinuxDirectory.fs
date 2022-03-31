module PlatformDirectory

open FSharpRailway
open System.IO
open System.Reactive.Subjects

open Engine
open Gtk
open Model
open FileSystem

let extendColumns columns = columns

let getIconPath (fileInfo: FileInfo) = 
    match fileInfo.Extension with
    | ext when ext |> String.length > 0 -> ext
    | _                                 -> ".noextension"

let getIcon (param: FileRequest) = 
    getIcon param.Path

let appendPlatformInfo (subj: Subject<FolderEvent>) requestId id (path: string) (items: DirectoryItem seq) = ()

let deleteItems = 
    deleteItems
    >> Option.mapOnlyError
    >> getError
    >> serializeToJson
