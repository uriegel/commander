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

let getEngineAndPathFrom (item: InputItem) (body: string) = 
    let getCharCount char str = 
        let filterSlash chr = chr = char
        str 
        |> Seq.filter filterSlash
        |> Seq.length
    
    let pathIsRoot path = 
        path |>String.endsWith "/" && path |> getCharCount '/' = 2


    let androidItem = JsonSerializer.Deserialize<GetItems> (body, getJsonOptions ())
    match androidItem.CurrentItem.ItemType, androidItem.Path with
    | ItemType.Parent, Some path when path |> pathIsRoot -> EngineType.Remotes, RemotesID
    // | _, RemotesID                                 -> EngineType.Remotes, ""
    | _                                                  -> EngineType.Root, RootID

let getItems (engine: EngineType) path = async {
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