module Android

open FSharpTools
open System.Text.Json

open Configuration
open Engine
open Model

type GetItems = {
    Path:        string option
    Engine:      EngineType
    CurrentItem: DirectoryItem
}

type GetFilesInput = {
    Path: string
}

type AndroidItem = {
    IsDirectory: bool
    IsHidden:    bool
    Name:        string
    Size:        int64
    Time:        int64
}

let getSlashCount = String.getCharCount '/'

let getIpAndFilePath path = 
    let getIndex () = 
        path 
        |> String.indexOfStart "/" 8 
    match getIndex () with
    | Some pos -> 
        path
        |> String.substring2 8 (pos - 8),
        path
        |> String.substring pos
    | None     ->
        path |> String.substring 8, "/"

let getFilePath path = 
    let getIndex () = 
        path 
        |> String.indexOfStart "/" 8 
        |> Option.defaultValue 0
    path
    |> String.substring (getIndex ())

let linuxPathCombine path additional = 
    if path |> String.endsWith "/" then path + additional
    else path + "/" + additional

let ensureRoot path = 
    match path |> getSlashCount with
    | 1 -> path + "/"
    | _ -> path

let getParent path = 
    let pos = path |> String.lastIndexOfChar '/' |> Option.defaultValue 0
    path 
    |> String.substring2 0 pos 
    |> ensureRoot

let getEngineAndPathFrom _ (body: string) = 
    let pathIsRoot path = 
        path |> String.endsWith "/" && path |> getFilePath = "/"

    let androidItem = JsonSerializer.Deserialize<GetItems> (body, getJsonOptions ())
    match androidItem.CurrentItem.ItemType, androidItem.Path with
    | ItemType.Parent, Some path when path |> pathIsRoot -> EngineType.Remotes, RemotesID
    | ItemType.Parent, Some path                         -> EngineType.Android, getParent path
    | ItemType.Directory, Some path                      -> EngineType.Android, linuxPathCombine path androidItem.CurrentItem.Name
    | _                                                  -> EngineType.Root, RootID

let getItems (engine: EngineType) path latestPath = async {
    let ip, filePath = path |> getIpAndFilePath
    let uri = sprintf "http://%s:8080/getfiles" ip
    let! items = HttpRequests.post<AndroidItem array> uri { Path = filePath } |> Async.AwaitTask
    
    let isDir item = item.IsDirectory
    let isFile item = not item.IsDirectory

    let getExtension item = 
        match item.Name |> String.indexOfChar '.' with
        | Some pos -> Some (item.Name |> String.substring pos)
        | None     -> None 

    let getDirItem item = {
        Index =       0
        Name =        item.Name
        Size =        item.Size
        ItemType =    ItemType.Directory
        Selectable =  true
        IconPath =    None
        IsHidden =    item.IsHidden
        IsDirectory = true
        Time =        item.Time |> DateTime.fromUnixTime
    }

    let getFileItem item = {
        Index =       0
        Name =        item.Name
        Size =        item.Size
        ItemType =    ItemType.File
        Selectable =  true
        IconPath =    item |> getExtension 
        IsHidden =    item.IsHidden
        IsDirectory = false
        Time =        item.Time |> DateTime.fromUnixTime
    }

    let sortByName item = item.Name |> String.toLower 

    let dirs = 
        items
        |> Seq.filter isDir
        |> Seq.sortBy sortByName
        |> Seq.map getDirItem 

    let files = 
        items
        |> Seq.filter isFile
        |> Seq.map getFileItem 

    let parent = seq {{ 
        Index =       0
        Name =        ".."
        Size =        0
        ItemType =    ItemType.Parent
        Selectable =  false
        IconPath =    None
        IsHidden =    false
        IsDirectory = true
        Time =        System.DateTime.MinValue
    }}

    let items = Seq.concat [
        parent
        dirs
        files
    ]

    let getName file =
        let pos = file |> String.lastIndexOfChar '/' |> Option.defaultValue 0
        file 
        |> String.substring (pos + 1)

    let selectFolder = 
        match latestPath with
        | Some latestPath when (latestPath |> String.length) > (path |> String.length) ->
            Some (getName latestPath)
        | _                                                 -> 
            None

    let result = {|
        Items      = items
        Path       = path
        Engine     = EngineType.Android
        LatestPath =   selectFolder
        Columns    = 
            if engine <> EngineType.Android then Some [| 
                { Name = "Name";  Column = "name"; Type = ColumnsType.NameExtension }
                { Name = "Datum"; Column = "time"; Type = ColumnsType.Time }
                { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
            |] else 
                None
    |}

    return JsonSerializer.Serialize (result, getJsonOptions ())
}