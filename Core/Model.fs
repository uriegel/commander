module Model
open FSharpTools
open Configuration

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
    Index:    int
    ExifTime: System.DateTime option
    Version:  FileVersion option
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

type FolderEvent = 
    | EnhancedInfo of EnhancedItem[]
    | GetItemsFinished
    | CopyProgress of CopyProgress

let serialize obj = TextJson.serialize (getJsonOptions ()) obj

type FileSystemType = 
    | None = 0
    | File = 1
    | Directory = 2
