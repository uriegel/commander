module Root

open FSharpTools
open System.IO
open System.Text.Json

open Configuration
open Functional

type RootItem = {
    Name:        string
    Description: string
    Size:        int64
}

let getRoot () = async {
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
    }

    let drives = 
        DriveInfo.GetDrives ()
        |> Array.map getDrive

    return JsonSerializer.Serialize (drives, getJsonOptions ())
}

