module DirectoryWatcher
open System.IO
open System.Threading
open Types
open FSharpTools
open FSharpTools.EnumExtensions

type DirectoryChangedType = 
    | Created = 0
    | Changed = 1
    | Renamed = 2
    | Deleted = 3

type DirectoryChangedEvent = {
    FolderId: string
    Path: string option
    Type: DirectoryChangedType 
    Item: DirectoryItem 
    OldName: string option
}

type DirectoryWatcher = {
    Id: string
    Path: string
    Dispose: unit->unit
}

// TODO to FSharpTools
let isDirectory (path: string) = 
    File.GetAttributes (path) |> hasFlag FileAttributes.Directory 

let monitor = obj()
let mutable private watchers = Map.empty<string, DirectoryWatcher> 

let sendEvent changedType (e: FileSystemEventArgs) =
    ()

[<TailCall>]
let rec checkChanged (finished: unit->bool) (renameEvent: SemaphoreSlim) = 
    async {
        try
            if finished() then
                ()
            else
                do! renameEvent.WaitAsync () |> Async.AwaitTask
                if finished() then
                    printfn "Finischiert"
                    ()
                else
                    printfn "Eine Änderung"
                    do! checkChanged finished renameEvent
        with
        | _ -> ()
    }   


let private createWatcher id (path: string) = 
    let fsw = new FileSystemWatcher (path)
    let renameEvent = new SemaphoreSlim (0, 1)
    let mutable finished = false
    fsw.NotifyFilter <- NotifyFilters.CreationTime 
                        ||| NotifyFilters.DirectoryName
                        ||| NotifyFilters.FileName
                        ||| NotifyFilters.LastWrite
                        ||| NotifyFilters.Size
    fsw.EnableRaisingEvents <- true

    let createItem fullName =
        if isDirectory fullName then
            createDirectoryItem (DirectoryInfo(fullName))
        else
            createFileItem (FileInfo(fullName)) Directory.getIconPath

    let sendCreatedEvent (e: FileSystemEventArgs) =
        Events.events.TryFind "DirectoryChanged"
        |> Option.iter (fun send -> send {
            FolderId = id
            Path = Some path
            Type = DirectoryChangedType.Created
            Item = createItem <| Directory.combinePathes [| path; e.Name |]
            OldName = None
        })

    let sendRenamedEvent (e: RenamedEventArgs) =
        Events.events.TryFind "DirectoryChanged"
        |> Option.iter (fun send -> send {
            FolderId = id
            Path = Some path
            Type = DirectoryChangedType.Renamed
            Item = createItem <| Directory.combinePathes [| path; e.Name |]
            OldName = Some e.OldName
        })

    let sendDeletedEvent (e: FileSystemEventArgs) =
        Events.events.TryFind "DirectoryChanged"
        |> Option.iter (fun send -> send {
            FolderId = id
            Path = Some path
            Type = DirectoryChangedType.Deleted
            Item = { Name = e.Name; Size = 0; IsDirectory = false; IconPath = None; IsHidden = false; Time = System.DateTime.MinValue }
            OldName = None
        })

    checkChanged (fun () -> finished) renameEvent |> Async.Start

    // TODO run Changed
    // TODO check thread is stopping
    fsw.Changed.Add <| sendEvent DirectoryChangedType.Changed
    fsw.Created.Add <| sendCreatedEvent
    fsw.Deleted.Add <| sendDeletedEvent
    fsw.Renamed.Add <| sendRenamedEvent
    
    {
        Id = id
        Path = path
        Dispose = (fun () -> 
            finished <- true
            renameEvent.Release () |> ignore
            renameEvent.Dispose ()
            fsw.Dispose ()
        )
    }

let install id path = 
    let exchangeWatcher watcher = 
        
        let checkExchangeWatcher w =
            if w.Id = id && w.Path = path then
                w
            else
                w.Dispose ()
                createWatcher id path
        
        Some (watcher
                |> Option.map checkExchangeWatcher
                |> Option.defaultWith (fun () -> createWatcher id path))

    lock monitor (fun () -> watchers <- watchers.Change(id, exchangeWatcher))
     


