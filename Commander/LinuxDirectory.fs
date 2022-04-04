module PlatformDirectory

open FSharpRailway
open FSharpTools
open System.IO
open System.Reactive.Subjects

open Configuration
open Engine
open Gtk
open Model
open FileSystem

let extendColumns columns = columns

let getIconPath (fileInfo: FileInfo) = 
    match fileInfo.Extension with
    | ext when ext |> String.length > 0 -> ext
    | _                                 -> ".noextension"

let private getIconScript = 
    let filename = saveResource (getElectronFile "geticon.py", "python/geticon.py")
    let getIconScript () = filename
    getIconScript    

open Option

let getIcon ext = async {
    let extractMime str = 
        let pos1 = str |> String.indexOf "('" 
        let pos2 = str |> String.indexOf "',"
        match pos1, pos2 with
        | Some pos1, Some pos2 -> Some (str |> String.substring2 (pos1+2) (pos2-pos1-2))
        | _                    -> None

    let replaceSlash str = Some (str |> String.replaceChar  '/' '-')
    let getMime = extractMime >=> replaceSlash

    let! mimeType = Process.runCmd "python3" (sprintf "%s *%s" (getIconScript ()) ext)
    // TODO: mapping exe, jar
    // TODO: ifFileNotExists def icon
    // TODO gnome <-> KDE
    return sprintf "/usr/share/icons/breeze/mimetypes/16/%s.svg" (mimeType |> getMime |> defaultValue "application-x-zerosize"), "image/svg+xml"
}

let appendPlatformInfo _ _ _ _ _ = ()

let deleteItems = 
    deleteItems
    >> mapOnlyError
    >> getError
    >> serializeToJson
