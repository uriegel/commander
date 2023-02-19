module Directory

open Microsoft.AspNetCore.Http
open Giraffe
open FSharpTools
open FSharpTools.ExifReader
open FSharpTools.Directory
open System
open System.IO
open System.Text.Json

open Configuration
open IO

#if Linux
open CommanderCore
open Gtk
open Microsoft.AspNetCore.Http.Features
#endif

#if Windows
open System.Drawing
open System.Drawing.Imaging
open System.Runtime.InteropServices
open ClrWinApi
open System.Diagnostics
#endif

type DirectoryItem = {
    Name:        string
    Size:        int64
    IsDirectory: bool
    IconPath:    string option
    IsHidden:    bool
    Time:        DateTime
}

let getDirItem (dirInfo: DirectoryInfo) = {
    Name =        dirInfo.Name
    Size =        0
    IsDirectory = true
    IconPath    = None
    IsHidden    = dirInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
    Time        = dirInfo.LastWriteTime
}

type GetFiles = {
    Path:            string
    ShowHiddenItems: bool
}

type GetExtendedItems = {
    Items: string[]
    Path: string
}

#if Windows 

type FileVersion = {
    Major: int
    Minor: int
    Patch: int
    Build: int
}
#endif

type ExtendedItem = {
    Date: DateTime option
#if Windows
    Version: FileVersion option
#endif
}

type ExtendedItemResult = {
    ExtendedItems: ExtendedItem seq
    Path: string
}

[<CLIMutable>]
type FileRequest = { Path: string }

let getIconPath (fileInfo: FileInfo) = 
    match fileInfo.Extension with
#if Windows 
    | ext when ext |> String.toLower = ".exe" -> fileInfo.FullName
#endif    
#if Linux 
    | ext when ext |> String.length > 0       -> ext
#endif    
    | _                                       -> ".noextension"

let getFileItem (fileInfo: FileInfo) = {
    Name =        fileInfo.Name
    Size =        fileInfo.Length
    IsDirectory = false
    IconPath    = Some <| getIconPath fileInfo
    IsHidden    = fileInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
    Time        = fileInfo.LastWriteTime
}

let serialize obj = TextJson.serialize (getJsonOptions ()) obj

let getItems (param: GetFiles) = async {
    
    let sortByName (item: DirectoryItem) = item.Name |> String.toLower 

    let dirInfo = DirectoryInfo param.Path
    let dirs = 
        dirInfo 
        |> getSafeDirectoriesFromInfo
        |> Seq.map getDirItem 
        |> Seq.sortBy sortByName
    let files = 
        dirInfo
        |> getSafeFilesFromInfo
        |> Seq.map getFileItem 

    let items = Seq.concat [
        dirs
        files
    ]

    let filterHidden item = not item.IsHidden

    let items: DirectoryItem seq = 
        match param.ShowHiddenItems with
        | true -> items 
        | _    -> items |> Seq.filter filterHidden

    let result = {|
        Items =        items
        Path =         dirInfo.FullName
    |}

    return result |> serialize
}

let getFiles () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<GetFiles>(body, getJsonOptions ())
            let! result = getItems param
            return! Json.text result next ctx
        }

let getExtendedItems (getExtended: GetExtendedItems) = async {

    let getExifDate (file: string) = 
        let getExifDate reader =
            reader 
            |> getDateValue ExifTag.DateTimeOriginal
            |> Option.orElseWith (fun () -> reader |> getDateValue ExifTag.DateTime) 
        let reader = 
            combine2Pathes getExtended.Path file
            |> getExif
        let result = 
            reader 
            |> Option.map getExifDate 
            |> Option.flatten
        reader |> Option.map (fun reader -> (reader :> IDisposable).Dispose ()) |> ignore
        result    

#if Windows

    let mapVersion (info: FileVersionInfo) =  
        {
            Major = info.FileMajorPart
            Minor = info.FileMinorPart
            Patch = info.FilePrivatePart
            Build = info.FileBuildPart
        }
    
    let getVersion (file: string) = 
        combine2Pathes getExtended.Path file
        |> FileVersionInfo.GetVersionInfo 
        |> Option.ofObj
        |> Option.map mapVersion

    let mapExtended (file: string) = 
        let exif = 
            if file.EndsWith(".jpg", StringComparison.InvariantCultureIgnoreCase) 
                || file.EndsWith(".png", StringComparison.InvariantCultureIgnoreCase) then
                    getExifDate file
                else
                    None
        let version = 
            if file.EndsWith(".exe", StringComparison.InvariantCultureIgnoreCase) 
                || file.EndsWith(".dll", StringComparison.InvariantCultureIgnoreCase) then
                    getVersion file
                else
                    None
        {
            Date = exif
            Version = version
        }

#endif

#if Linux
    let mapExtended (file: string) = 
        if file.EndsWith(".jpg", StringComparison.InvariantCultureIgnoreCase) 
            || file.EndsWith(".png", StringComparison.InvariantCultureIgnoreCase) then
            {
                Date = getExifDate file
            }
        else
            {
                Date = None
            }
#endif

    let result = {
        Path = getExtended.Path
        ExtendedItems = 
            getExtended.Items
            |> Seq.map mapExtended
    }
    
    return result |> serialize
}

#if Linux

let getIcon ext = async {
    // TODO KDE
    // let getKdeIcon ext = async {
    //     let extractMime str = 
    //         let pos1 = str |> String.indexOf "('" 
    //         let pos2 = str |> String.indexOf "',"
    //         match pos1, pos2 with
    //         | Some pos1, Some pos2 
    //             -> Some (str |> String.substring2 (pos1+2) (pos2-pos1-2))
    //         | _ -> None

    //     let replaceSlash str = Some (str |> String.replaceChar  '/' '-')
    //     let getMime = extractMime >=> replaceSlash

    //     let mapVarious mime =
    //         match mime with
    //         | "/usr/share/icons/breeze/mimetypes/16/application-x-msdos-program.svg" 
    //                         -> "/usr/share/icons/breeze/mimetypes/16/application-x-ms-dos-executable.svg"
    //         | "/usr/share/icons/breeze/mimetypes/16/application-java-archive.svg"    
    //                         -> "/usr/share/icons/breeze/mimetypes/16/application-x-jar.svg"
    //         | s     -> s

    //     let! mimeType = asyncRunCmd "python3" (sprintf "%s *%s" (getIconScript ()) ext)

    //     let icon = 
    //         sprintf "/usr/share/icons/breeze/mimetypes/16/%s.svg" (mimeType |> getMime |> defaultValue "application-x-zerosize")
    //         |> mapVarious
    //         |> getExistingFile
    //         |> Option.defaultValue "/usr/share/icons/breeze/mimetypes/16/application-x-zerosize.svg"
    //     return icon, "image/svg+xml"
    // }

    return! 
        match getPlatform () with
//        | Platform.Kde -> getKdeIcon ext
        | _            -> async { return getIcon ext, "image/png" }
}

let getIconRequest: FileRequest -> HttpHandler = 
    fun param (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let startTime = Configuration.getStartDateTime ()
            let! (iconPath, mimeType) = getIcon param.Path
            let sendIcon = (setContentType <| mimeType) >=> (streamFile false iconPath None <| Some startTime)
            return! sendIcon next ctx
        }    

let getImage (fileRequest: FileRequest) = 
    streamFile false fileRequest.Path None None

let getMovie (fileRequest: FileRequest) = 
    streamFile true fileRequest.Path None None

#endif

#if Windows

let getIcon ext = async {
    let rec getIconHandle callCount = async {
        if ext |> String.contains "\\" then
            return Icon.ExtractAssociatedIcon(ext).Handle
        else
            let mutable shinfo = ShFileInfo()
            SHGetFileInfo(ext, FileAttributeNormal, &shinfo, Marshal.SizeOf shinfo,
                SHGetFileInfoConstants.ICON
                ||| SHGetFileInfoConstants.SMALLICON
                ||| SHGetFileInfoConstants.USEFILEATTRIBUTES
                ||| SHGetFileInfoConstants.TYPENAME) |> ignore

            if shinfo.IconHandle <> IntPtr.Zero then
                return shinfo.IconHandle
            elif callCount < 3 then
                do! Async.Sleep 29
                return! getIconHandle <| callCount + 1
            else
                return Icon.ExtractAssociatedIcon(@"C:\Windows\system32\SHELL32.dll").Handle
    }

    let! iconHandle = getIconHandle 0
    use icon = Icon.FromHandle iconHandle
    use bitmap = icon.ToBitmap()
    let ms = new MemoryStream()
    bitmap.Save(ms, ImageFormat.Png)
    ms.Position <- 0L
    DestroyIcon iconHandle |> ignore
    return ms
}

let getIconRequest: IconRequest -> HttpHandler = 
    fun param (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let startTime = Configuration.getStartDateTime ()
            let! iconStream = getIcon param.Path
            return! (streamData false iconStream None <| Some startTime) next ctx
        }    

#endif

