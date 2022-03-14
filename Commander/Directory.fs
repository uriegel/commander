module Directory

open FSharpTools
open System.IO
open System.Text.Json

open Configuration
open Engine
open Model
open PlatformDirectory

type Item = {
    Name:        string
    Size:        int64
    ItemType:    ItemType
    IconPath:    string option
    IsHidden:    bool
    IsDirectory: bool
    Time:        System.DateTime
}

let private getDateTime = 
    let startTime = System.DateTimeOffset.UtcNow
    let getDateTime () = startTime
    getDateTime

let getStartDateTime () = getDateTime ()

let getEngineAndPathFrom path item = 
    match path, item with
    | Root.IsRoot -> EngineType.Root, "root"
    | _, _        -> EngineType.Directory, Path.Combine (path, item)

let getItems path param = async {
    
    let latestPath = param.Path

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
        IconPath    = Some <| getIconPath fileInfo
        IsHidden    = fileInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
        Time        = fileInfo.LastWriteTime
    }

    let sortByName item = item.Name |> String.toLower 

    let dirInfo = DirectoryInfo(path)
    let     dirs = 
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

    let getItemI i (n: Item) = {| n with Index = i |}

    let items = 
        match param.ShowHiddenItems with
        | true -> items 
        | _    -> items |> Array.filter filterHidden
        |> Array.mapi getItemI

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
            if param.Engine <> EngineType.Directory then Some [| 
                    { Name = "Name"; Column = "name"; Type = ColumnsType.Name }
                    { Name = "Datum"; Column = "time"; Type = ColumnsType.Time }
                    { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
                |] else 
                    None
    |}

    // TODO Parallel.for
    // all items iter -> if jpg then exif jpg with id
    // TODO Send every 100 items with requestId
    // TODO Break loop when folderId = and requestId higher

    return JsonSerializer.Serialize (result, getJsonOptions ())
}

