module Root

open FSharpTools
open System.Text.Json

open Engine
open Model
open Utils
open Configuration

type RootItem = {
    Name:        string
    Description: string
    MountPoint:  string
    Size:        int64
    DriveType:   string
    ItemType:    ItemType
    IsMounted:   bool
    IsDirectory: bool
}

type GetItems = {
    Path:        string option
    Engine:      EngineType
    CurrentItem: RootItem
}

let getEngineAndPathFrom (item: Item) (body: string) = 
    let rootItem = JsonSerializer.Deserialize<GetItems> (body, getJsonOptions ())
    match rootItem.CurrentItem.MountPoint with
    | value when value |> String.startsWith "/" -> EngineType.Directory, rootItem.CurrentItem.MountPoint
    | _                                         -> EngineType.Directory, rootItem.CurrentItem.MountPoint

let (|IsRoot|IsNotRoot|) (path, currentItem) =
    if path = "/" && currentItem = ".." then
        IsRoot
    else
        IsNotRoot

let getItems engine latestPath = async {
    let getHomeDir = 
        let getHomeDir () = System.Environment.GetFolderPath(System.Environment.SpecialFolder.Personal)
        memoizeSingle getHomeDir

    let! res = runCmd "lsblk" "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE" ()
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
            Size        = getString 0 1 |> parseInt64 0
            MountPoint  = mountPoint
            ItemType    = ItemType.Harddrive
            IsMounted   = mountPoint |> String.length > 0 
            IsDirectory = true
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
            IsDirectory = true
            ItemType    = ItemType.Homedrive
            DriveType   = "" 
        } |]
        mounted
        unMounted
    ]

    let selectedFolder = 
        let findItem path item = item.MountPoint = path
        match latestPath with
        | Some path ->
            let item = items |> Array.find (findItem path)
            Some item.Name
        | None      -> 
            None

    let result = {|
        Items = items
        Path = "root"
        Engine = EngineType.Root
        LatestPath = selectedFolder
        Columns = 
            if engine <> EngineType.Root then Some [| 
                { Name = "Name"; Column = "name"; Type = ColumnsType.Name }
                { Name = "Bezeichnung"; Column = "description"; Type = ColumnsType.Normal }
                { Name = "Mountpoint"; Column = "mountPoint"; Type = ColumnsType.Normal }
                { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
            |] else 
                None
    |}
    return JsonSerializer.Serialize (result, getJsonOptions ())
}

