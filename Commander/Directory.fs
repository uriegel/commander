module Directory 
open System
open System.IO
open FSharpTools
open Types

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
    IconPath: string option
    IsHidden: bool
    Time: DateTime
}

type GetFilesResult = {
    Items: DirectoryItem array
    Path: string
    DirCount : int
    FileCount: int
}

type DirectoryItemInfo = {
    Path: string
    Items: DirectoryItem array
}

let getFiles (input: GetFiles) = 

    let getDirectoryItem (info: IO.FileSystemInfo) = 
        match info with
        | :? DirectoryInfo as di -> 
                    {
                        Name = di.Name
                        Size = 0
                        IsDirectory = true
                        IconPath = None
                        IsHidden = (di.Attributes &&& FileAttributes.Hidden) = FileAttributes.Hidden
                        Time = di.LastWriteTime
                    }
        | :? FileInfo as fi ->
                    {
                        Name = fi.Name
                        Size = fi.Length
                        IsDirectory = false
                        IconPath = Some <| Directory.getIconPath fi
                        IsHidden = (fi.Attributes &&& FileAttributes.Hidden) = FileAttributes.Hidden
                        Time = fi.LastWriteTime
                    }
        | _ -> failwith "Either Directory nor File"

    let getFilesResult path (items: DirectoryItemInfo) = 
        {
            Items = items.Items
            Path = items.Path
            DirCount = items.Items |> Seq.filter (fun i -> i.IsDirectory) |> Seq.length
            FileCount = items.Items |> Seq.filter (fun i -> not i.IsDirectory) |> Seq.length
        }

    let filterHidden (info: DirectoryItem) = 
        input.ShowHiddenItems || not info.IsHidden

    task {
        let path = 
            if input.Mount = Some true then 
                Directory.mount input.Path
            else
                input.Path
        return 
            Directory.getFileSystemInfo path
            // TODO |> Validate
            |> Result.map (fun (info: FileSystemInfo) -> {
                                                                        Items = info.Items |> Array.map getDirectoryItem |> Array.filter filterHidden
                                                                        Path = info.Path 
                                                                    })  
            |> Result.map(getFilesResult path)
            |> toJsonResult
    }

