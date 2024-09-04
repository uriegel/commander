module Directory
open System.Diagnostics
open System.IO
open FSharpTools
open Types

let mount path = path

let getIconPath (info: FileInfo) =
    match 
        info.Extension
        |> Option.checkNull 
        with
        | Some ext when String.icompare ext ".exe" = 0 -> info.FullName
        | Some ext when ext.Length > 0 -> ext
        | _ -> ".noextension"

let getAdditionalInfo path = 
    let mapVersion (version: FileVersionInfo) = 
        {
            Major = version.FileMajorPart
            Minor = version.FileMinorPart
            Patch = version.FilePrivatePart
            Build = version.FileBuildPart
        }
    
    FileVersionInfo.GetVersionInfo path
    |> Option.checkNull
    |> Option.map mapVersion
