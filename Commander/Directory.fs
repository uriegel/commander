module Directory

open FSharpTools
open System.IO
open System.Text.Json

open Engine
open Model
open Configuration

let getEngineAndPathFrom path item = 
    match path, item with
    | Root.IsRoot -> EngineType.Root, "root"
    | _, _        -> EngineType.Directory, Path.Combine (path, item)

let getItems engine path latestPath showHiddenItems = async {

    let getDirItem (dirInfo: DirectoryInfo) = {
        Name =        dirInfo.Name
        Size =        0
        ItemType =    ItemType.Directory
        IsDirectory = true
        IconPath    = None
        IsHidden    = dirInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
        Time        = dirInfo.LastWriteTime
    }

    let getFileItem (fileInfo: FileInfo) = {
        Name =        fileInfo.Name
        Size =        fileInfo.Length
        ItemType =    ItemType.File
        IsDirectory = false
        IconPath    = None
        IsHidden    = fileInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
        Time        = fileInfo.LastWriteTime
    }

    let sortByName item = item.Name |> String.toLower 

    let dirInfo = DirectoryInfo(path)
    let dirs = 
        dirInfo.GetDirectories()
        |> Array.map getDirItem 
        |> Array.sortBy sortByName
    let files = 
        dirInfo.GetFiles()
        |> Array.map getFileItem 

    let parent = [| { 
        Name = ".."
        Size = 0
        ItemType = ItemType.Parent
        IconPath = None
        IsHidden = false
        IsDirectory = true
        Time = System.DateTime.MinValue
    } |]

    let items = Array.concat [
        parent
        dirs
        files
    ]

    let filterHidden item = not item.IsHidden
    let items = 
        match showHiddenItems with
        | true -> items 
        | _    -> items |> Array.filter filterHidden

    let selectFolder = 
        match latestPath with
        | Some latestPath when path |> String.endsWith ".." ->
            let di = DirectoryInfo latestPath
            Some di.Name
        | _                                                 -> 
            None

    let result = {|
        Items =      items
        Path =       dirInfo.FullName
        Engine =     EngineType.Directory
        LatestPath = selectFolder
        Columns = 
            if engine <> EngineType.Directory then Some [| 
                    { Name = "Name"; Column = "name"; Type = ColumnsType.Name }
                    { Name = "Datum"; Column = "time"; Type = ColumnsType.Time }
                    { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
                |] else 
                    None
    |}
    return JsonSerializer.Serialize (result, getJsonOptions ())
}

