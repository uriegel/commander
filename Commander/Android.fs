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
    isHidden:    bool
    Name:        string
    Size:        int64
    Time:        int64
}

let getIpAndFilePath path = 
    let getIndex () = 
        path 
        |> String.indexOfStart "/" 8 
        |> Option.defaultValue 0
    path
    |> String.substring2 8 (getIndex () - 8),
    path
    |> String.substring (getIndex ())

let getFilePath path = 
    let getIndex () = 
        path 
        |> String.indexOfStart "/" 8 
        |> Option.defaultValue 0
    path
    |> String.substring (getIndex ())

let getEngineAndPathFrom (item: InputItem) (body: string) = 
    let pathIsRoot path = 
        path |> String.endsWith "/" && path |> getFilePath = "/"

    let androidItem = JsonSerializer.Deserialize<GetItems> (body, getJsonOptions ())
    match androidItem.CurrentItem.ItemType, androidItem.Path with
    | ItemType.Parent, Some path when path |> pathIsRoot -> EngineType.Remotes, RemotesID
    // | _, RemotesID                                 -> EngineType.Remotes, ""
    | _                                                  -> EngineType.Root, RootID

let getItems (engine: EngineType) path = async {
    let ip, path = path |> getIpAndFilePath
    let uri = sprintf "http://%s:8080/getfiles" ip
    let! items = HttpRequests.post<AndroidItem array> uri { Path = path } |> Async.AwaitTask
    printfn "Eitems %O"    items



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
//        dirs
//        files
    ]

    let result = {|
        Items  = items
        Path   = path
        Engine = EngineType.Android
        Columns = 
            if engine <> EngineType.Android then Some [| 
                { Name = "Name";  Column = "name"; Type = ColumnsType.NameExtension }
                { Name = "Datum"; Column = "time"; Type = ColumnsType.Time }
                { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
            |] else 
                None
    |}

    return JsonSerializer.Serialize (result, getJsonOptions ())
}