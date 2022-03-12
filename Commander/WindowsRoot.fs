module Root

open FSharpTools
open System.IO
open System.Text.Json

open Configuration
open Engine
open Model
open Utils

type RootItem = {
    Name:        string
    Description: string
    Size:        int64
    ItemType:    ItemType
    IsMounted:   bool
    IsDirectory: bool
}

type GetItemResult = {
    Items:   RootItem[]
    Path:    string
    Engine:  EngineType
    Columns: Column[] option
}

let getEngineAndPathFrom (item: Item) _ = 
    match item.Name with
    | value when value |> String.contains ":" -> EngineType.Directory, item.Name
    | _                                       -> EngineType.Directory, item.Name

let getItems engine = async {
    let getHomeDir = 
        let getHomeDir () = System.Environment.GetFolderPath(System.Environment.SpecialFolder.Personal)
        memoizeSingle getHomeDir

    let getSaveVal getVal =
        try 
            Some <| getVal ()
        with
            _ -> None

    let getVolumeLabel (driveInfo: DriveInfo) () = driveInfo.VolumeLabel
    let getSaveVolumeLabel driveInfo = getSaveVal <| getVolumeLabel driveInfo |> Option.defaultValue ""

    let getSize (driveInfo: DriveInfo) () = driveInfo.TotalSize
    let getSaveSize driveInfo = getSaveVal <| getSize driveInfo |> Option.defaultValue 0

    let getDrive (driveInfo: DriveInfo) = {
        Name =        driveInfo.Name
        Description = getSaveVolumeLabel driveInfo
        Size =        getSaveSize driveInfo
        ItemType =    ItemType.Harddrive
        IsDirectory = true
        IsMounted =   true
    }

    let drives = 
        DriveInfo.GetDrives ()
        |> Array.map getDrive

    let result = {
        Items = drives
        Path = "root"
        Engine = EngineType.Root
        Columns = 
            if engine <> EngineType.Root then Some [| 
                { Name = "Name"; Column = "name"; Type = ColumnsType.Name }
                { Name = "Beschreibung"; Column = "description"; Type = ColumnsType.Normal }
                { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
            |] else 
                None
    }
    return JsonSerializer.Serialize (result, getJsonOptions ())
}


