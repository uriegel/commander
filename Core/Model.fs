module Model
open FSharpTools
open Configuration
open System
open System.IO

type ItemType =
| Parent        = 1
| File          = 2
| Directory     = 3
| Harddrive     = 4
| Homedrive     = 5
| Remotes       = 6
| AddRemote     = 7
| Remote        = 8
| AndroidRemote = 9

[<Literal>]
let RootID    = "root"
[<Literal>]
let RemotesID = "remotes"
[<Literal>]
let AndroidID = "android"

type DirectoryItem = {
    Index:       int
    Name:        string
    Size:        int64
    Selectable:  bool
    ItemType:    ItemType
    IsDirectory: bool
    IconPath:    string option
    IsHidden:    bool
    Time:        System.DateTime
}

type RequestId = {
    mutable Id: int
}

type FileVersion = {
    Major: int
    Minor: int
    Patch: int
    Build: int
}

type EnhancedItem = {
    Index:     int
    ExifTime:  System.DateTime option
    Version:   FileVersion option
}

type EnhancedInfo = {
    RequestId: int
    EnhancedItems: EnhancedItem[]
}

type CopyProgressInfo = {
    Total:  int64
    Current: int64
}

type CopyProgress = {
    CurrentFile: string
    Total:       CopyProgressInfo
    Current:     CopyProgressInfo
}

type RenameRemote = {
    Name:    string
    NewName: string
}

type FolderEvent = 
    | EnhancedInfo of EnhancedInfo
    | GetItemsFinished
    | CopyProgress of CopyProgress
    | RenameRemote of RenameRemote

let serialize obj = TextJson.serialize (getJsonOptions ()) obj

type FileSystemType = 
    | None = 0
    | File = 1
    | Directory = 2

type ConflictItem = {
    Conflict:    string
    IconPath:    string option
    SourceTime:  DateTime
    TargetTime:  DateTime
    SourceSize:  int64
    TargetSize:  int64
}

let sortConflicts (item: ConflictItem) =
    item.Conflict.ToCharArray()
    |> Array.filter (fun n -> n = Path.DirectorySeparatorChar)
    |> Array.length
    , item.Conflict

