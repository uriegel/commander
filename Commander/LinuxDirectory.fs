module PlatformDirectory

open System.IO
open System.Reactive.Subjects

open Engine
open Model

let extendColumns columns = columns

let getIconPath (fileInfo: FileInfo) = 
    match fileInfo.Extension with
    | ext when ext |> String.length > 0 -> ext
    | _                                 -> ".noextension"

let getIcon (param: FileRequest) = 
    Gtk.getIcon param.Path

let appendPlatformInfo (subj: Subject<FolderEvent>) requestId id (path: string) (items: DirectoryItem seq) = ()
