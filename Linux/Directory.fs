module Directory
open System.IO
open FSharpTools
open FSharpTools.String
open Types
open RequestResult
open GtkDotNet

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

let deleteItems path names  = 
    let deleteItems name =    
        let deleteItem name = 
            let filePath = path |> Directory.attachSubPath name
            let file = GFile.New filePath
            file.Trash () 
            |> csNothingResultToResult

        let mapError e = 
            match e with
            | Some e -> e |> Result.mapError gerrorToError
            | None -> Ok ()

        names 
        |> Seq.map deleteItem
        |> Seq.tryFind Result.isError
        |> mapError
        |> Result.mapError fromIOError

    Gtk.Dispatch(deleteItems)
