module Root

open FSharpTools
open System.IO
open System.Text.Json

open Configuration
open Functional
open FSharpTools.Process
open System

type RootItem = {
    Name:        string
    Description: string
    Size:        int64
    MountPoint:  string
    IsMounted:   bool
    DriveType:   string
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

    let! res = asyncRunCmd "lsblk" "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE" 
    let driveStrs = res |> String.splitChar '\n'
    let columnPositions = 
        let title = driveStrs[0]
        let getPart key = title |> String.indexOf key |> Option.defaultValue 0
        [|
            0
            getPart "NAME"
            getPart "LABEL"
            getPart "MOUNT"
            getPart "FSTYPE"
        |]
    let constructDrives driveString =
        let getString pos1 pos2 =
            driveString 
            |> String.substring2 columnPositions[pos1] (columnPositions[pos2]-columnPositions[pos1]) 
            |> String.trim
        let trimName name = 
            if name |> String.length > 2 && name[1] = '─' then
                name |> String.substring 2
            else
                name
        let mountPoint = getString 3 4

        {
            Name        = getString 1 2 |> trimName
            Description = getString 2 3
            Size        = getString 0 1 |> String.parseInt64 |> Option.defaultValue 0
            MountPoint  = mountPoint
            IsMounted   = mountPoint |> String.length > 0 
            DriveType   = driveString |> String.substring columnPositions[4] |> String.trim
        }

    let filterDrives (n: string) = n[columnPositions[1]] > '~'
    let getItems () = 
        driveStrs
        |> Array.skip 1
        |> Array.filter filterDrives
        |> Array.map constructDrives

    let items = getItems ()
    let mounted = items |> Array.filter (fun n -> n.IsMounted)
    let unMounted = items |> Array.filter (fun n -> not n.IsMounted)
    let items = Array.concat [ 
        [| { 
            Name        = "~"
            Description = "home"
            MountPoint  = getHomeDir ()
            Size        = 0
            IsMounted   = true
            DriveType   = ""
        } |]
        mounted
        [| { 
            Name        = "remotes"
            Description = "Zugriff auf entfernte Geräte"
            MountPoint  = ""
            Size        = 0
            IsMounted   = true
            DriveType   = ""
        } |]
        unMounted
    ]

    return JsonSerializer.Serialize (items, getJsonOptions ())
}

