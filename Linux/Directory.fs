module Directory
open System.IO
open FSharpTools
open FSharpTools.String
open Types
open RequestResult


let mount path = 
    Process.runCmd "udisksctl" (sprintf "mount -b /dev/%s" path)
    |> subStringAfter " at "
    |> Option.defaultValue path 
    |> String.trim
    
let getIconPath (info: FileInfo) =
    match 
        info.Extension
        |> Option.checkNull 
        with
        | Some ext when ext.Length > 0 -> ext
        | _ -> ".noextension"

let getAdditionalInfo path
    = None

let onEnter (param: OnEnterParam) =
    Process.runCmd "xdg-open" (sprintf "\"%s\"" param.Path) |> ignore
    returnReqNone ()


