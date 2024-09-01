module Types
open System
open System.IO

type Empty = { Nil: int }
type JsonResult<'a, 'b> = { Ok: 'a option; Err: 'b option }

[<CLIMutable>]
type FileRequest = { Path: string }

let toJsonResult (result: Result<'a, 'b>) = 
    match result with
    | Ok ok -> { Ok = Some ok; Err = None }
    | Error err -> { Ok = None; Err = Some err } 

type DirectoryItem = {
    Name: string
    Size: int64
    IsDirectory: bool
    IconPath: string option
    IsHidden: bool
    Time: DateTime
}

let createDirectoryItem (info: DirectoryInfo) =
    {
        Name = info.Name
        Size = 0
        IsDirectory = true
        IconPath = None
        IsHidden = (info.Attributes &&& FileAttributes.Hidden) = FileAttributes.Hidden
        Time = info.LastWriteTime
    }

let createFileItem (info: FileInfo) getIconPath =
    {
        Name = info.Name
        Size = info.Length
        IsDirectory = false
        IconPath = Some <| getIconPath info
        IsHidden = (info.Attributes &&& FileAttributes.Hidden) = FileAttributes.Hidden
        Time = info.LastWriteTime
    }
