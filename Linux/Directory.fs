module Directory
open FSharpTools
open System.IO

/// <summary>
/// Returns a substring beween 2 strings 'startStr' and 'endStr'
/// </summary>
/// <param name="startStr">After this str the substring starts</param>
/// <param name="str">The string to be extracted</param>
/// <returns>'Some substring' between startStr and endStr or None</returns>
let subStringAfter startStr str = 
    let startIndex = str |> String.indexOf startStr
    match startIndex with
    | Some s -> Some (str |> String.substring (s + (startStr |> String.length)))
    | _ -> None

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
