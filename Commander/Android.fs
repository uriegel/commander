module Android

open FSharpTools
open System.Text.Json

open Configuration
open Engine
open Model
open FSharpTools.Directory
open FSharpTools.Result
open FileSystem
open FSharpTools.Option
open HttpRequests
open FolderEvents
open System.IO
open System
open FSharpTools.AsyncResult

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
    Exists: bool
    File:   string
    Size:   int64
    Time:   int64
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
    LocalPath:   string
    RequestParam: RequestParam
}

let mutable copyItemCache: ItemsToCopy option = None

let getAndroidFileNames sourcePath items = 

    let getPath item =
        let path = combine2Pathes sourcePath item
        let pos = path |> String.indexOfCharStart '/' 8 |> Option.defaultValue 0
        path |> String.substring pos

    items 
        |> Seq.map getPath
        |> Seq.toArray

let prepareCopy items sourcePath targetPath = async {

    let requestParam = sourcePath |> getRequestParam

    let fileNames = getAndroidFileNames sourcePath items

    let! itemInfos = 
        post<RawFileInfo array> (getClient requestParam.BaseUrl) "getfilesinfos" { Files = fileNames } 
        |> Async.AwaitTask

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
                if File.Exists targetItem && item.Exists then
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

    let copyItems = {
            Items = itemInfos |> Array.map getFileInfo
            LocalPath = targetPath
            RequestParam = requestParam   
        } 

    copyItemCache <- Some copyItems                 

    return copyItems.Items
        |> Array.choose (fun n -> n.Conflict)
        |> Array.sortBy sortConflicts
        |> serialize
}

let reversePrepareCopy items sourcePath targetPath = async {

    let requestParam = targetPath |> getRequestParam

    let getPath item = combine2Pathes sourcePath item
    
    let fileNames = 
            items 
            |> Seq.map getPath
            |> Seq.toArray

    let! itemInfos = 
        post<RawFileInfo array> (getClient requestParam.BaseUrl) "getfilesinfos" { 
                Files = getAndroidFileNames targetPath items 
            } 
        |> Async.AwaitTask

    let getFileInfo (item: RawFileInfo) = 
        let sourceSubPath = 
            item.File 
            |> String.substring ((requestParam.FilePath |> String.length) + 1) 

        let sourceItem = 
            sourceSubPath 
            |> combine2Pathes sourcePath

        let getIconPath (fileInfo: IO.FileInfo) = 
            match fileInfo.Extension with
            | ext when ext |> String.length > 0 
                -> ext
            | _  -> ".noextension"

        let sourceInfo = FileInfo sourceItem
        {
            File =     sourceInfo.Name
            Size =     sourceInfo.Length
            Time =     sourceInfo.LastWriteTime
            Conflict = 
                if item.Exists then
                    Some {
                        Conflict   =  sourceInfo.Name
                        IconPath   =  Some <| getIconPath sourceInfo
                        SourceTime =  item.Time |> DateTime.fromUnixTime
                        SourceSize =  item.Size
                        TargetTime =  sourceInfo.LastWriteTime
                        TargetSize =  sourceInfo.Length
                    }
                else
                    None        
        }

    let copyItems = {
            Items = itemInfos |> Array.map getFileInfo
            LocalPath = sourcePath
            RequestParam = requestParam   
        } 

    copyItemCache <- Some copyItems

    return copyItems.Items
        |> Array.choose (fun n -> n.Conflict)
        |> Array.sortBy sortConflicts
        |> serialize
}

let getTotalSize conflictsExcluded = 

    let add current item = 
        current + item.Size

    match copyItemCache with
    | Some value -> 
        if conflictsExcluded then 
            value.Items
            |> Array.filter (fun n -> n.Conflict.IsNone)
            |> Array.fold add 0L
        else
            value.Items 
            |> Array.fold add 0L
    | None                     -> 0L

let copyItems id sourcePath move conflictsExcluded=
    let subj = getEventSubject id   
    
    let copyItem (request: RequestParam) (targetPath: string) currentTotalcopied item =
        if copyItemCache.IsSome then
            let fileInfo = FileInfo item.File
            let totalSize = getTotalSize conflictsExcluded

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
        subj.OnNext <| CopyProgress { 
            CurrentFile = ""
            Total = { 
                Total = 0
                Current = 0
            }
            Current = { 
                Total = 0
                Current = 0
            }
        }

        match copyItemCache with
        | Some (value: ItemsToCopy) ->
            if conflictsExcluded then 
                value.Items
                |> Array.filter (fun n -> n.Conflict.IsNone)
            else
                value.Items        
            |> Array.fold (copyItem value.RequestParam value.LocalPath) 0L 
            |> ignore
        | None -> ()

    let a () = exceptionToResult copyItems
    a
    >> Result.mapError mapIOError
    >> mapOnlyError
    >> getError
    >> serialize
    

let reverseCopyItems id sourcePath move conflictsExcluded=
    let subj = getEventSubject id   

    let copyItem (request: RequestParam) (localPath: string) currentTotalcopied item = 
        if copyItemCache.IsSome then
            let localFile = combine2Pathes localPath item.File
            let remotePath = combine2Pathes request.FilePath item.File
            let totalSize = getTotalSize conflictsExcluded

            subj.OnNext <| CopyProgress { 
                CurrentFile = localFile
                Total = { 
                    Total = currentTotalcopied
                    Current = currentTotalcopied + 0L
                }
                Current = { 
                    Total = 23
                    Current = 0L
                }
            }

            let progress p = 
                subj.OnNext <| CopyProgress { 
                    CurrentFile = localFile
                    Total = { 
                        Total = totalSize
                        Current = currentTotalcopied + p
                    }
                    Current = { 
                        Total = item.Size
                        Current = p
                    }
                }

            postFile (getClient request.BaseUrl) "postfile" localFile remotePath (DateTimeOffset item.Time) progress
            currentTotalcopied + item.Size
        else
            0L

    let copyItems () =
        subj.OnNext <| CopyProgress { 
            CurrentFile = ""
            Total = { 
                Total = 0
                Current = 0
            }
            Current = { 
                Total = 0
                Current = 0
            }
        }

        match copyItemCache with
        | Some (value: ItemsToCopy) ->
            if conflictsExcluded then 
                value.Items
                |> Array.filter (fun n -> n.Conflict.IsNone)
            else
                value.Items        
            |> Array.fold (copyItem value.RequestParam value.LocalPath) 0L 
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
