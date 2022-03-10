module Root

open FSharpTools
open System.IO

open Engine
open Model
open PlatformModel
open Utils

type Root () = 
    let getHomeDir = 
        let getHomeDir () = System.Environment.GetFolderPath(System.Environment.SpecialFolder.Personal)
        memoizeSingle getHomeDir

    interface IEngine with
        member val Id = EngineType.Root with get
        member _.getItems (param: GetItems) = async {

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
                Name = driveInfo.Name
                Description = getSaveVolumeLabel driveInfo
                Size = getSaveSize driveInfo
                ItemType = ItemType.Harddrive
                IsMounted = true
            }

            let drives = 
                DriveInfo.GetDrives ()
                |> Array.map getDrive

            return {
                Items = drives
                Path = "root"
                Engine = EngineType.Root
                Columns = 
                    if param.Engine <> EngineType.Root then Some [| 
                            { Name = "Name"; Column = "name"; Type = ColumnsType.Name }
                            { Name = "Beschreibung"; Column = "description"; Type = ColumnsType.Normal }
                            { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
                        |] else None
            }
        }


