module Root

open FSharpTools
open System.IO

open Engine
open Model
open PlatformModel
open Utils

let getEngineAndPathFrom (item: RootItem) = 
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

    return {
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
}


