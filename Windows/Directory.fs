module Directory
open System.IO
open FSharpTools

let mount path = path

let getIconPath (info: FileInfo) =
    match 
        info.Extension
        |> Option.checkNull 
        with
        | Some ext when String.icompare ext ".exe" = 0 -> info.FullName
        | Some ext when ext.Length > 0 -> ext
        | _ -> ".noextension"
