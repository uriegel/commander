module Directory

open FSharpRailway
open FSharpTools
open FSharpTools.ExifReader
open FSharpRailway.Option
open System
open System.IO
open System.Text.Json

open Configuration
open Engine
open FileSystem
open FolderEvents
open IO
open Model
open Directory
open Result 

let getEngineAndPathFrom path item = 
    match path, item with
    | Root.IsRoot -> EngineType.Root, RootID
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

let getDirItem (dirInfo: DirectoryInfo) = {
    Index =       0
    Name =        dirInfo.Name
    Size =        0
    ItemType =    ItemType.Directory
    Selectable =  true
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
    Selectable =  true
    IsDirectory = false
    IconPath    = Some <| getIconPath fileInfo
    IsHidden    = fileInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
    Time        = fileInfo.LastWriteTime
}

let getItems path (param: GetItems) = async {
    
    let requestId = getRequestId param.FolderId param.RequestId
    let sortByName item = item.Name |> String.toLower 

    let dirInfo = DirectoryInfo(path)
    let dirs = 
        dirInfo 
        |> getSafeDirectoriesFromInfo
        |> Seq.map getDirItem 
        |> Seq.sortBy sortByName
    let files = 
        dirInfo
        |> getSafeFilesFromInfo
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

    let filterHidden item = not item.IsHidden

    let getItemI i (n: DirectoryItem) = { n with Index = i }

    let items: DirectoryItem seq = 
        match param.ShowHiddenItems with
        | true -> items 
        | _    -> items |> Seq.filter filterHidden
        |> Seq.mapi getItemI

    let selectFolder = 
        match param.Path with
        | Some latestPath when path |> String.endsWith ".." ->
            let di = DirectoryInfo latestPath
            Some di.Name
        | _                                                 -> 
            None

    let result = {|
        Items =        items
        Path =         dirInfo.FullName
        Engine =       EngineType.Directory
        LatestPath =   selectFolder
        WithEnhanced = true
        Columns = 
            if param.Engine <> EngineType.Directory then Some (extendColumns [| 
                { Name = "Name";  Column = "name"; Type = ColumnsType.NameExtension }
                { Name = "Datum"; Column = "time"; Type = ColumnsType.Time }
                { Name = "Größe"; Column = "size"; Type = ColumnsType.Size }
            |]) else 
                None
    |}

    let appendExifTime path (items: DirectoryItem seq) = 

        let getExifDate (file: string) = 
            let getExifDate reader =
                reader 
                |> getDateValue ExifTag.DateTimeOriginal
                |> Option.orElseWith (fun () -> reader |> getDateValue ExifTag.DateTime) 
            let reader = getExif file
            let result = 
                reader 
                |> Option.map getExifDate 
                |> Option.flatten
            reader |> Option.map (fun reader -> (reader :> IDisposable).Dispose ()) |> ignore
            result

        let addExifDate (item: DirectoryItem) = 
            if requestId.Id = param.RequestId then
                let file = Path.Combine(path, item.Name)
                { 
                    Index = item.Index
                    ExifTime = file |> getExifDate
                    Version = None
                }
            else
                { 
                    Index = -1
                    ExifTime = None
                    Version = None
                }

        let filterEnhanced item = 
            item.Name |> String.endsWithComparison "jpg" System.StringComparison.OrdinalIgnoreCase
            && requestId.Id = param.RequestId

        let exifItems = 
            items 
            |> Seq.filter filterEnhanced
            |> Seq.map addExifDate
            |> Seq.toArray

        if requestId.Id = param.RequestId && exifItems.Length > 0 then
            let subj = getEventSubject param.FolderId
            subj.OnNext <| EnhancedInfo exifItems

    async { 
        items |> appendExifTime result.Path |>ignore
        items |> appendPlatformInfo (getEventSubject param.FolderId) requestId param.RequestId result.Path |>ignore
        if requestId.Id = param.RequestId then
            let subj = getEventSubject param.FolderId
            subj.OnNext <| GetItemsFinished
    } |> Async.StartAsTask |> ignore

    return result |> serialize
}

let getFile (body: string) = async {
    let item = JsonSerializer.Deserialize<GetFile> (body, getJsonOptions ())
    return JsonSerializer.Serialize({ Path = Path.Combine (item.Path, item.CurrentItem.Name) }, getJsonOptions ()) 
}

let createFolder = 
    Path.Combine 
    >> Directory.create
    >> Result.mapError mapIOError
    >> mapOnlyError
    >> getError
    >> serialize

type TwoFilePath = {
    Path   : string
    Name   : string
    NewName: string
}

let renameItem = 
    let rename param =
        let combinePath = combine2Pathes param.Path
    
        move (combinePath param.Name, combinePath param.NewName)

    rename
    >> Result.mapError mapIOError
    >> mapOnlyError
    >> getError
    >> serialize

type ConflictItem = {
    Conflict:    string
    IconPath:    string option
    SourceTime:  DateTime
    TargetTime:  DateTime
    SourceSize:  int64
    TargetSize:  int64
}

type CopyItem = {
    Path:       string
    TargetPath: string
    Time:       DateTime
    Size:       int64
    Conflict:   ConflictItem option
}

type ItemsToCopy = {
    Items: CopyItem array
    Directories: string[]
}

type FileCopy = {
    Items: DirectoryItem[]
    BasePath:  string
}

let mutable copyItemCache: ItemsToCopy option = None

let prepareFileCopy (items: string[]) =
    let getDirectoryItem file = 
        if Directory.Exists file then
            getDirItem <| DirectoryInfo file
        else
            getFileItem <| FileInfo file
    let path = 
        if Directory.Exists items[0] then
            (DirectoryInfo items[0]).Parent.FullName
        else
            (FileInfo items[0]).DirectoryName
    {
        BasePath = path
        Items  = items |> Array.map getDirectoryItem
    } |> serialize

let prepareCopy items sourcePath targetPath =

    let rec getFileInfoFromDir path =
        Seq.concat <| seq {
            getSafeFiles path
            getSafeDirectories path
                |> Array.map (fun n -> n.FullName)
                |> Seq.collect getFileInfoFromDir 
                |> Seq.toArray
        }

    let getFileInfo path name = 
        let file = combine2Pathes path name
        if File.Exists file then
            seq { FileInfo file }
        else
            getFileInfoFromDir file

    let getCopyItem (info: FileInfo) =
        let targetSubPath = 
            info.FullName 
            |> String.substring ((sourcePath |> String.length) + 1) 

        let targetItem = 
            targetSubPath 
            |> combine2Pathes targetPath

        {
            Path = info.FullName
            TargetPath = targetItem
            Time = info.LastWriteTime
            Size = info.Length
            Conflict = 
                if File.Exists targetItem then
                    let targetInfo = FileInfo targetItem
                    Some {
                        Conflict   =  targetSubPath
                        IconPath   =  Some <| getIconPath targetInfo
                        SourceTime =  info.LastWriteTime
                        SourceSize =  info.Length
                        TargetTime =  targetInfo.LastWriteTime
                        TargetSize =  targetInfo.Length
                    }
                else
                    None        
        }

    let itemsToCopy = 
        items 
        |> Seq.collect (getFileInfo sourcePath)
        |> Seq.map getCopyItem
        |> Seq.toArray

    copyItemCache <- Some {
        Items = itemsToCopy
        Directories = 
            items
            |> Seq.map (combine2Pathes sourcePath)
            |> Seq.filter existsDirectory
            |> Seq.toArray
    }
    
    let sortConflicts (item: ConflictItem) =
        item.Conflict.ToCharArray()
        |> Array.filter (fun n -> n = Path.DirectorySeparatorChar)
        |> Array.length
        , item.Conflict

    itemsToCopy
    |> Array.choose (fun n -> n.Conflict)
    |> Array.sortBy sortConflicts
    |> serialize

let copyItems id sourcePath move conflictsExcluded=

    let deleteEmptyFolders directories =
        let rec deleteEmptyFolder path =
            getSafeDirectories path
            |> Array.map (fun n -> n.FullName) 
            |> Array.iter deleteEmptyFolder

            Process.runCmd "rmdir" (sprintf "\"%s\"" path) |> ignore
        
        directories
        |> Array.iter deleteEmptyFolder

    let subj = getEventSubject id               

    let copyItem sourcePath totalSize total item =
        if copyItemCache.IsSome then
            let itemPath = 
                item.Path 
                |> String.substring ((sourcePath |> String.length) + 1)

            let buffer: byte array = Array.zeroCreate 8192
            // Functional with Result
            use file = File.OpenRead item.Path
            let fi = FileInfo item.TargetPath
            if not (existsDirectory fi.DirectoryName) then
                Directory.CreateDirectory fi.DirectoryName |> ignore

            let copy () = 
                use targetFile = createFile true item.TargetPath

                let progress processedBytes = 
                    subj.OnNext <| CopyProgress { 
                        CurrentFile = itemPath  
                        Total = { 
                            Total = totalSize
                            Current = total + processedBytes
                        }
                        Current = { 
                            Total = item.Size
                            Current = processedBytes
                        }
                    }

                let rec copy (bytesCopied: int64) = 
                    let read = file.Read (buffer, 0, buffer.Length)
                    if read > 0 then
                        targetFile.Write (buffer, 0, read)
                        let processedBytes = bytesCopied + int64(read)
                        progress processedBytes
                        copy processedBytes
                    else 
                        bytesCopied + total
                copy 0 
        
            let size = copy ()

            let ct = File.GetCreationTime item.Path
            File.SetCreationTime (item.TargetPath, ct)
            let lwt = File.GetLastWriteTime item.Path
            File.SetLastWriteTime (item.TargetPath, lwt)
            let attributes = File.GetAttributes item.Path
            File.SetAttributes (item.TargetPath, attributes)
            if move |> Option.defaultValue false then 
                File.Delete item.Path                 
            size
        else
            0L

    let copyItems () = 
        match copyItemCache with
        | Some copyItems ->
            let itemsToCopy = 
                if conflictsExcluded then 
                    copyItems.Items
                    |> Array.filter (fun n -> n.Conflict.IsNone)
                else
                    copyItems.Items

            let totalSize = 
                itemsToCopy
                |> Array.fold (fun acc item -> item.Size + acc) 0L

            itemsToCopy
            |> Array.fold (copyItem sourcePath totalSize) 0L
            |> ignore
        | _ -> ()
        
        match move, copyItemCache with
        | Some true, Some copyItems 
               -> deleteEmptyFolders copyItems.Directories
        | _, _ -> ()


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
