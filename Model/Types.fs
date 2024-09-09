module Types
open System
open System.IO

type Empty = { Nil: int option }
type JsonResult<'a, 'b> = { Ok: 'a option; Err: 'b option }

type IOError = 
    | Unknown = 0
    | AccessDenied = 1
    | AlreadyExists = 2
    | FileNotFound = 3
    | DeleteToTrashNotPossible = 4
    | Exn = 5
    | NetNameNotFound = 6
    | PathNotFound = 7
    | NotSupported = 8
    | PathTooLong = 9
    | Canceled = 10
    | WrongCredentials = 11
    | NoDiskSpace = 12
    | OperationInProgress = 13
    | NoError = 14
    | UacNotStarted = 1099

type ErrorType = {
    status: IOError
    statusText: string option
}

type SpecialKeys = {
    Alt: bool
    Ctrl: bool
    Shift: bool
}

type OnEnterParam = {
    Path: string
    Keys: SpecialKeys option
}

type RenameItemParam = {
    Path: string
    Name: string
    NewName: string
}

type DeleteItemsParam = {
    Path: string
    Names: string array
}

let exceptionToError (exn: exn) =
    match exn with
    | :? DirectoryNotFoundException as dnfe -> { status = IOError.PathNotFound; statusText = Some dnfe.Message }
    | :? UnauthorizedAccessException as uae -> { status = IOError.AccessDenied; statusText = Some uae.Message }
    | :? IOException as ioe when ioe.HResult = 13 -> { status = IOError.AccessDenied; statusText = Some ioe.Message }
    | :? IOException as ioe when ioe.HResult = -2147024891 -> { status = IOError.AccessDenied; statusText = Some ioe.Message }
    | e -> { status = IOError.Exn; statusText = Some e.Message }

[<CLIMutable>]
type FileRequest = { Path: string }

let toJsonResult (result: Result<'a, 'b>) = 
    match result with
    | Ok ok -> { Ok = Some ok; Err = None }
    | Error err -> { Ok = None; Err = Some err } 

let fromJsonResult (result: JsonResult<'a, 'b>) = 
    if result.Err.IsNone then
        if result.Ok.IsSome then
            Ok result.Ok.Value
        else
            Ok (() :> obj :?> 'a)
    else
        Error result.Err.Value

type DirectoryItem = {
    Name: string
    Size: int64
    IsDirectory: bool
    IconPath: string option
    IsHidden: bool
    Time: DateTime
}

type ExifData = {
    DateTime: DateTime option
    Latitude: double option
    Longitude: double option
}

type Version = {
    Major: int
    Minor: int
    Patch: int
    Build: int
}

type ExtendedItem = {
    ExifData: ExifData option 
    Version: Version option
}

type GetExtendedItemsResult = {
    ExtendedItems: ExtendedItem array
    Path: string
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
        Size = 
            try 
                info.Length
            with 
            | _ -> 0
        IsDirectory = false
        IconPath = Some <| getIconPath info
        IsHidden = (info.Attributes &&& FileAttributes.Hidden) = FileAttributes.Hidden
        Time = info.LastWriteTime
    }

