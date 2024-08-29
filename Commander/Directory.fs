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

let getFiles (input: GetFiles) = 

    let getDirectoryItem (info: FileSystemInfo) = 
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
                        IconPath = None// TODO Directory.GetIconPath(info),
                        IsHidden = (fi.Attributes &&& FileAttributes.Hidden) = FileAttributes.Hidden
                        Time = fi.LastWriteTime
                    }
        | _ -> failwith "Either Directory nor File"

    let getFilesResult path (items: DirectoryItem array) = 
        {
            Items = items
            Path = path
            DirCount = items |> Seq.filter (fun i -> i.IsDirectory) |> Seq.length
            FileCount = items |> Seq.filter (fun i -> not i.IsDirectory) |> Seq.length
        }


    task {
        // TODO if input.Mount = Some true then 
        //     mount ()
        return 
            Directory.getFileSystemInfos input.Path
            // |> Validate
            |> Result.map (fun infos -> infos |> Array.map getDirectoryItem)  
            |> Result.map(getFilesResult input.Path)
            |> toJsonResult
    }

