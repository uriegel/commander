module Remotes
open Model
open Engine
open System.Text.Json
open Configuration

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

let mutable remotesMap: Map<string, Remote[]> = [] |> Map.ofList

let getRemotes folderId =
    remotesMap.TryFind folderId |> Option.defaultValue [||]

let getRemoteItems folderId = 
    let mapRemote remote = 
        {
            Name        = remote.Name
            Ip          = remote.Ip
            Selectable  = true
            IsDirectory = true
            ItemType    = if remote.IsAndroid then ItemType.AndroidRemote else ItemType.Remote
        }     

    getRemotes folderId 
    |> Array.map mapRemote

let getItems engine folderId latestPath = async {
    let items = Array.concat [ 
        [| { 
            Name        = ".."
            Ip          = ""
            Selectable  = false
            IsDirectory = true
            ItemType    = ItemType.Parent
        } |]
        getRemoteItems <| folderId
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

let put folderId (remotes: Remote[]) = 
    let recentRemotes = getRemotes folderId
    let newRemotes = Array.concat [ 
        recentRemotes
        remotes 
    ]
    remotesMap <- remotesMap |> Map.add folderId newRemotes
