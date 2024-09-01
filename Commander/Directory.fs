module Directory 
open System
open System.IO
open FSharpTools
open FSharpTools.Functional
open Types

type GetFiles = {
    Id: string 
    Path: string
    ShowHiddenItems: bool
    Mount: bool option
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
        | :? DirectoryInfo as di -> createDirectoryItem di
        | :? FileInfo as fi -> createFileItem fi Directory.getIconPath
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
                                                                    }
                                                                    |> sideEffect (fun n -> DirectoryWatcher.install input.Id n.Path)
                                                                    )  
            |> Result.map(getFilesResult path)
            |> toJsonResult
    }

