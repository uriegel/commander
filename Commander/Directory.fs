module Directory

open System.IO

open Engine
open PlatformModel


let getEngineAndPathFrom path item = 
    match path, item with
    | "/", ".." -> EngineType.Root, "root"
    | _, _      -> EngineType.Directory, Path.Combine (path, item)

let getItems engine path = async {
    // let! res = runCmd "lsblk" "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE" ()
    // let driveStrs = res |> String.splitChar '\n'
    // let columnPositions = 
    //     let title = driveStrs[0]
    //     let getPart key = title |> String.indexOf key |> Option.defaultValue 0
    //     [|
    //         0
    //         getPart "NAME"
    //         getPart "LABEL"
    //         getPart "MOUNT"
    //         getPart "FSTYPE"
    //     |]

    return {
        Items = [||]
        Path = "/"
        Engine = EngineType.Directory
        Columns = 
            if engine <> EngineType.Root then Some [| 
                    { Name = "Name"; Column = "name"; Type = ColumnsType.Name }
                    { Name = "Bezeichnung"; Column = "description"; Type = ColumnsType.Normal }
                    { Name = "Mountpoint"; Column = "mountPoint"; Type = ColumnsType.Normal }
                    { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
                |] else None
    }
}

