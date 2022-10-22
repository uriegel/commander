module Android

open FSharpTools
open System.Text.Json

open Configuration
open Engine
open Model
open FSharpTools.Directory
open FSharpRailway.Result
open FileSystem
open FSharpRailway.Option
open HttpRequests
open FSharpRailway
open FolderEvents
open System.IO
open System
open FileSystem
open System.Text.Json.Serialization.Skippable

type GetItems = {
    Path:        string option
    Engine:      EngineType
    CurrentItem: DirectoryItem
}

type GetFilesInput = {
    Path: string
}

type AndroidItem = {
    IsDirectory: bool
    IsHidden:    bool
    Name:        string
    Size:        int64
    Time:        int64
}

type RequestParam = {
    BaseUrl:  string
    FilePath: string
}

let getSlashCount = String.getCharCount '/'

let getRequestParam path = 
    let getUrl = sprintf "http://%s:8080"
    match 
        path 
        |> String.indexOfStart "/" 8 
    with
    | Some pos -> {
            BaseUrl = 
                path
                |> String.substring2 8 (pos - 8)
                |> getUrl
            FilePath = path |> String.substring pos
        }
    | None -> {
            BaseUrl = 
                path 
                |> String.substring 8
                |> getUrl
            FilePath = "/"
        }

let getFilePath path = 
    let getIndex () = 
        path 
        |> String.indexOfStart "/" 8 
        |> Option.defaultValue 0
    path
    |> String.substring (getIndex ())

let linuxPathCombine path additional = 
    if path |> String.endsWith "/" then path + additional
    else path + "/" + additional

let ensureRoot path = 
    match path |> getSlashCount with
    | 1 -> path + "/"
    | _ -> path

let getParent path = 
    let pos = path |> String.lastIndexOfChar '/' |> Option.defaultValue 0
    path 
    |> String.substring2 0 pos 
    |> ensureRoot

let getEngineAndPathFrom _ (body: string) = 
    let pathIsRoot path = 
        path |> String.endsWith "/" && path |> getFilePath = "/"

    let androidItem = JsonSerializer.Deserialize<GetItems> (body, getJsonOptions ())
    match androidItem.CurrentItem.ItemType, androidItem.Path with
    | ItemType.Parent, Some path when path |> pathIsRoot -> EngineType.Remotes, RemotesID
    | ItemType.Parent, Some path                         -> EngineType.Android, getParent path
    | ItemType.Directory, Some path                      -> EngineType.Android, linuxPathCombine path androidItem.CurrentItem.Name
    | _                                                  -> EngineType.Root, RootID

let getExtension fileName = 
    match fileName |> String.indexOfChar '.' with
    | Some pos -> Some (fileName |> String.substring pos)
    | None     -> None 

let getItems (engine: EngineType) path latestPath = async {
    let param = path |> getRequestParam
    let client = HttpRequests.getClient param.BaseUrl
    let! items = HttpRequests.post<AndroidItem array> client "getfiles" { Path = param.FilePath } |> Async.AwaitTask
    
    let isDir item = item.IsDirectory
    let isFile item = not item.IsDirectory

    let getDirItem item = {
        Index =       0
        Name =        item.Name
        Size =        item.Size
        ItemType =    ItemType.Directory
        Selectable =  false
        IconPath =    None
        IsHidden =    item.IsHidden
        IsDirectory = true
        Time =        item.Time |> DateTime.fromUnixTime
    }

    let getFileItem item = {
        Index =       0
        Name =        item.Name
        Size =        item.Size
        ItemType =    ItemType.File
        Selectable =  true
        IconPath =    item.Name |> getExtension 
        IsHidden =    item.IsHidden
        IsDirectory = false
        Time =        item.Time |> DateTime.fromUnixTime
    }

    let sortByName item = item.Name |> String.toLower 

    let dirs = 
        items
        |> Seq.filter isDir
        |> Seq.sortBy sortByName
        |> Seq.map getDirItem 

    let files = 
        items
        |> Seq.filter isFile
        |> Seq.map getFileItem 

    let parent = seq {{ 
        Index =       0
        Name =        ".."
        Size =        0
        ItemType =    ItemType.Parent
        Selectable =  false
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

    let getName file =
        let pos = file |> String.lastIndexOfChar '/' |> Option.defaultValue 0
        file 
        |> String.substring (pos + 1)

    let selectFolder = 
        match latestPath with
        | Some latestPath when (latestPath |> String.length) > (path |> String.length) ->
            Some (getName latestPath)
        | _                                                                            -> 
            None

    let result = {|
        Items      = items
        Path       = path
        Engine     = EngineType.Android
        LatestPath =   selectFolder
        Columns    = 
            if engine <> EngineType.Android then Some [| 
                { Name = "Name";  Column = "name"; Type = ColumnsType.NameExtension }
                { Name = "Datum"; Column = "time"; Type = ColumnsType.Time }
                { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
            |] else 
                None
    |}

    return JsonSerializer.Serialize (result, getJsonOptions ())
}

type RawFileInfo = {
    File: string
    Size: int64
    Time: int64
}

type FileInfo = {
    File:     string
    Size:     int64
    Time:     DateTime
    Conflict: ConflictItem option
}

type GetFilesInfosInput = { Files: string[]}

type ItemsToCopy = {
    Items:        FileInfo[]
    TargetPath:   string
    RequestParam: RequestParam
}

let mutable copyItemCache: ItemsToCopy option = None

let prepareCopy items sourcePath targetPath = async {

    let requestParam = sourcePath |> getRequestParam   

    let getPath item =
        let path = combine2Pathes sourcePath item
        let pos = path |> String.indexOfCharStart '/' 8 |> Option.defaultValue 0
        path |> String.substring pos

    let fileNames = 
            items 
            |> Seq.map getPath
            |> Seq.toArray

    let getFileInfo (item: RawFileInfo) = 
        let targetSubPath = 
            item.File 
            |> String.substring ((requestParam.FilePath |> String.length) + 1) 

        let targetItem = 
            targetSubPath 
            |> combine2Pathes targetPath
    
        let getIconPath (fileInfo: IO.FileInfo) = 
            match fileInfo.Extension with
            | ext when ext |> String.length > 0 
                -> ext
            | _  -> ".noextension"

        {
            File =     item.File
            Size =     item.Size
            Time =     item.Time |> DateTime.fromUnixTime
            Conflict = 
                if File.Exists targetItem then
                    let targetInfo = FileInfo targetItem
                    Some {
                        Conflict   =  targetSubPath
                        IconPath   =  Some <| getIconPath targetInfo
                        SourceTime =  item.Time |> DateTime.fromUnixTime
                        SourceSize =  item.Size
                        TargetTime =  targetInfo.LastWriteTime
                        TargetSize =  targetInfo.Length
                    }
                else
                    None        
        }

    let! itemInfos = 
        post<RawFileInfo array> (getClient requestParam.BaseUrl) "getfilesinfos" { Files = fileNames } 
        |> Async.AwaitTask

    let copyItems = {
        Items = itemInfos |> Array.map getFileInfo
        TargetPath = targetPath
        RequestParam = requestParam   
    } 

    copyItemCache <- Some copyItems

    return copyItems.Items
        |> Array.choose (fun n -> n.Conflict)
        |> Array.sortBy sortConflicts
        |> serialize
}

let copyItems id sourcePath move conflictsExcluded=
    let subj = getEventSubject id   
    
    let copyItem (request: RequestParam) (targetPath: string) currentTotalcopied item =
        if copyItemCache.IsSome then
            let fileInfo = FileInfo item.File
            let totalSize = 

                let add current item = 
                    current + item.Size

                match copyItemCache with
                | Some value -> value.Items |> Array.fold add 0L
                | None                     -> 0L

            let copyFile (source: Stream) target length =
                use target = File.Create target
                let buffer: byte array = Array.zeroCreate 8192
                
                let rec copy alreadyRead = 
                    let read = source.Read(buffer, 0, buffer.Length) 

                    let currentRead = (int64 read) + alreadyRead

                    subj.OnNext <| CopyProgress { 
                        CurrentFile = fileInfo.Name
                        Total = { 
                            Total = totalSize
                            Current = currentTotalcopied + currentRead
                        }
                        Current = { 
                            Total = length
                            Current = currentRead
                        }
                    }

                    match read, currentRead with
                    | 0, _ -> alreadyRead
                    | read, alreadyRead when alreadyRead < length -> 
                        target.Write (buffer, 0, read)
                        copy alreadyRead
                    | _, alreadyRead when alreadyRead = length -> 
                        target.Write (buffer, 0, read)
                        alreadyRead
                    | _, _ -> alreadyRead

                copy 0

            let processStream stream length lastWriteTime =
                let file = combine2Pathes targetPath fileInfo.Name
                copyFile stream file length |> ignore
            
                let setLastWriteTime path time = File.SetLastWriteTime (path, time)
                lastWriteTime
                |> Option.iter (setLastWriteTime file)


            getStream (getClient request.BaseUrl) "getfile" {
                Path = item.File  
            } processStream
            currentTotalcopied + item.Size
        else
            0L

    let copyItems () =
        match copyItemCache with
        | Some value ->
            value.Items
            |> Array.fold (copyItem value.RequestParam value.TargetPath) 0L 
            |> ignore
        | None -> ()

    let a () = exceptionToResult copyItems
    a
    >> Result.mapError mapIOError
    >> mapOnlyError
    >> getError
    >> serialize
    

let postCopyItems () = 
    copyItemCache <- None
    "{}"

let cancelCopy () = 
    copyItemCache <- None
    "{}"
