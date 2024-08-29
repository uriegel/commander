module Directory 
open System
open FSharpTools

type GetFiles = {
    Id: string 
    Path: string
    ShowHiddenItems: bool
    Mount: bool option
}

type DirectoryItem = {
    Name: string
    Size: int64
    IsDirectory: bool
    IconPath: string
    IsHidden: bool
    Time: DateTime
}

type GetFilesResult = {
    Items: DirectoryItem array
    Path: string
    DirCount : int
    FileCount: int
}

let getFiles (input: GetFiles) = 
    task {
        // TODO if input.Mount = Some true then 
        //     mount ()
        Directory.getFileSystemInfos input.Path
    }
