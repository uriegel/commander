module Directory

open System.IO
open System.Text.Json
open System.Text.Json.Serialization

open Engine
open Model
open PlatformModel
open Configuration

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

    let items = [| {| Name = ".."; Size = 0; ItemType = ItemType.Parent; IconPath = None; IsHidden = false; IsDirectory = true; Time = System.DateTime.Now |} |]
    let result = {|
        Items = items
        Path = "/"
        Engine = EngineType.Directory
        Columns = 
            if engine <> EngineType.Directory then Some [| 
                    { Name = "Name"; Column = "name"; Type = ColumnsType.Name }
                    { Name = "Datum"; Column = "time"; Type = ColumnsType.Time }
                    { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
                |] else 
                    None
    |}
    return JsonSerializer.Serialize (result, getJsonOptions ())
}

