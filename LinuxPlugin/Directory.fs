module Directory

open FSharpRailway
open FSharpTools
open System.IO

open Configuration
open Directory
open Gtk
open Model
open FileSystem

let extendColumns columns = columns

let private getIconScript = 
    let filename = saveResource (getElectronFile "geticon.py", "python/geticon.py")
    let getIconScript () = filename
    getIconScript    

let getIconPath (fileInfo: FileInfo) = 
    match fileInfo.Extension with
    | ext when ext |> String.length > 0 
         -> ext
    | _  -> ".noextension"

open Option

let getIcon ext = async {
    let getKdeIcon ext = async {
        let extractMime str = 
            let pos1 = str |> String.indexOf "('" 
            let pos2 = str |> String.indexOf "',"
            match pos1, pos2 with
            | Some pos1, Some pos2 
                -> Some (str |> String.substring2 (pos1+2) (pos2-pos1-2))
            | _ -> None

        let replaceSlash str = Some (str |> String.replaceChar  '/' '-')
        let getMime = extractMime >=> replaceSlash

        let mapVarious mime =
            match mime with
            | "/usr/share/icons/breeze/mimetypes/16/application-x-msdos-program.svg" 
                            -> "/usr/share/icons/breeze/mimetypes/16/application-x-ms-dos-executable.svg"
            | "/usr/share/icons/breeze/mimetypes/16/application-java-archive.svg"    
                            -> "/usr/share/icons/breeze/mimetypes/16/application-x-jar.svg"
            | s     -> s

        let! mimeType = Process.runCmd "python3" (sprintf "%s *%s" (getIconScript ()) ext)

        let icon = 
            sprintf "/usr/share/icons/breeze/mimetypes/16/%s.svg" (mimeType |> getMime |> defaultValue "application-x-zerosize")
            |> mapVarious
            |> getExistingFile
            |> Option.defaultValue "/usr/share/icons/breeze/mimetypes/16/application-x-zerosize.svg"
        return icon, "image/svg+xml"
    }

    return! 
        match getPlatform () with
        | Platform.Kde -> getKdeIcon ext
        | _            -> async { return Gtk.getIcon ext, "image/png" }
}

let appendPlatformInfo _ _ _ _ _ = ()

let deleteItems = 
    deleteItems
    >> mapOnlyError
    >> getError
    >> serializeToJson

