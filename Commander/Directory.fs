module Directory

open FSharpTools
open FSharpTools.ExifReader
open FSharpRailway.Option
open System.IO
open System.Reactive.Subjects
open System.Text.Json

open Configuration
open Engine
open Model
open PlatformDirectory
open PlatformModel
open System.Diagnostics

let leftFolderReplaySubject = new Subject<FolderEvent>()
let rightFolderReplaySubject = new Subject<FolderEvent>()

let private getDateTime = 
    let startTime = System.DateTimeOffset.UtcNow
    let getDateTime () = startTime
    getDateTime

let getStartDateTime () = getDateTime ()

let getEngineAndPathFrom path item = 
    match path, item with
    | Root.IsRoot -> EngineType.Root, "root"
    | _, _        -> EngineType.Directory, Path.Combine (path, item)

let private leftRequestId = { Id = 0}
let private rightRequestId = { Id = 0}
let getRequestId folderId value = 
    match folderId with
    | "folderLeft"  -> 
        leftRequestId.Id <- value
        leftRequestId
    | _             -> 
        rightRequestId.Id <- value
        rightRequestId

let getItems path param = async {
    
    let latestPath = param.Path

    let requestId = getRequestId param.FolderId param.RequestId

    let getDirItem (dirInfo: DirectoryInfo) = {
        Index =       0
        Name =        dirInfo.Name
        Size =        0
        ItemType =    ItemType.Directory
        IsDirectory = true
        IconPath    = None
        IsHidden    = dirInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
        Time        = dirInfo.LastWriteTime
    }

    let getFileItem (fileInfo: FileInfo) = {
        Index =       0
        Name =        fileInfo.Name
        Size =        fileInfo.Length
        ItemType =    ItemType.File
        IsDirectory = false
        IconPath    = Some <| getIconPath fileInfo
        IsHidden    = fileInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
        Time        = fileInfo.LastWriteTime
    }

    let sortByName item = item.Name |> String.toLower 

    let dirInfo = DirectoryInfo(path)
    let dirs = 
        dirInfo.GetDirectories()
        |> Seq.map getDirItem 
        |> Seq.sortBy sortByName
    let files = 
        dirInfo.GetFiles()
        |> Seq.map getFileItem 

    let parent = seq {{ 
        Index =       0
        Name =        ".."
        Size =        0
        ItemType =    ItemType.Parent
        IconPath =    None
        IsHidden =    false
        IsDirectory = true
        Time =        System.DateTime.MinValue
    }}

    let items = Seq.concat [
        parent
        dirs
        files
    ]

    let filterHidden item = not item.IsHidden

    let getItemI i (n: DirectoryItem) = { n with Index = i }

    let items: DirectoryItem seq = 
        match param.ShowHiddenItems with
        | true -> items 
        | _    -> items |> Seq.filter filterHidden
        |> Seq.mapi getItemI

    let selectFolder = 
        match latestPath with
        | Some latestPath when path |> String.endsWith ".." ->
            let di = DirectoryInfo latestPath
            Some di.Name
        | _                                                 -> 
            None

    let result = {|
        Items =      items
        Path =       dirInfo.FullName
        Engine =     EngineType.Directory
        LatestPath = selectFolder
        Columns = 
            if param.Engine <> EngineType.Directory then Some [| 
                { Name = "Name";  Column = "name"; Type = ColumnsType.Name }
                { Name = "Datum"; Column = "time"; Type = ColumnsType.Time }
                { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
            |] else 
                None
    |}

    let appendExifTime path (items: DirectoryItem seq) = 

        let addExifDate (item: DirectoryItem) = 
            if requestId.Id = param.RequestId then
                let getExifDateOriginal = getExif >=> getDateValue ExifTag.DateTimeOriginal
                let getExifDate = getExif >=> getDateValue ExifTag.DateTime
                
                let file = Path.Combine(path, item.Name)
                { 
                    Index = item.Index
                    ExifTime = file |> getExifDateOriginal |> Option.orElseWith (fun () -> file |> getExifDate) 
                }
            else
                { 
                    Index = -1
                    ExifTime = None
                }

        let filterEnhanced item = 
            item.Name |> String.endsWithComparison "jpg" System.StringComparison.OrdinalIgnoreCase
            && requestId.Id = param.RequestId

        let exifItems = 
            items 
            |> Seq.filter filterEnhanced
            |> Seq.map addExifDate
            |> Seq.toArray

        let getEventSubject () = 
            if param.FolderId = "folderLeft" then 
                leftFolderReplaySubject
            else
                rightFolderReplaySubject

        if requestId.Id = param.RequestId && exifItems.Length > 0 then
            let subj = getEventSubject ()
            subj.OnNext <| EnhancedInfo exifItems

    async { 
        items |> appendExifTime result.Path |>ignore
        items |> appendPlatformInfo requestId param.RequestId result.Path |>ignore
    } |> Async.StartAsTask |> ignore

    return JsonSerializer.Serialize (result, getJsonOptions ())
}

