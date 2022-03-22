module Remotes
open Model
open Engine
open System.Text.Json
open Configuration
open System.Collections.Concurrent

type RemoteItem = {
    Name:        string
    Ip:          string
    ItemType:    ItemType
    Selectable:  bool
    IsDirectory: bool
}

type Remote = {
    Name:      string
    Ip:        string
    IsAndroid: bool
}

let remotesMap = ConcurrentDictionary<string, Remote []>()

let getItems engine latestPath = async {

    let items = Array.concat [ 
        [| { 
            Name        = ".."
            Ip          = ""
            Selectable  = false
            IsDirectory = true
            ItemType    = ItemType.Parent
        } |]
        [| { 
            Name        = "Hinzufügen..."
            Ip          = ""
            Selectable  = false
            IsDirectory = true
            ItemType    = ItemType.AddRemote
        } |]
    ]
    
    let selectedFolder = 
        let findItem path (item: RemoteItem) = item.Ip = path
        match latestPath with
        | Some path ->
            match items |> Array.tryFind (findItem path) with
            | Some item -> Some item.Name
            | None      -> None
        | None      -> 
            None

    let result = {|
        Items  = items
        Path   = RemotesID
        Engine = EngineType.Remotes
        LatestPath = selectedFolder
        Columns = 
            if engine <> EngineType.Remotes then Some [| 
                { Name = "Name"; Column = "name"; Type = ColumnsType.Name }
                { Name = "IP-Adresse"; Column = "ip"; Type = ColumnsType.Normal }
            |] else 
                None
    |}
    return JsonSerializer.Serialize (result, getJsonOptions ())}

let put (folderId: string) (remotes: Remote[]) = 
    remotesMap[folderId] <- remotes
