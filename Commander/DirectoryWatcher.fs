module DirectoryWatcher
open System.IO
open System.Threading

type DirectoryChangedType = 
    | Created
    | Changed
    | Renamed
    | Deleted


type DirectoryWatcher = {
    Id: string
    Path: string
    Dispose: unit->unit
}

let monitor = obj()
let mutable private watchers = Map.empty<string, DirectoryWatcher> 

let sendEvent changedType (e: FileSystemEventArgs) =
    ()


let private createWatcher id (path: string) = 
    let fsw = new FileSystemWatcher (path)
    let renameEvent = new  ManualResetEvent(false)
    fsw.NotifyFilter <- NotifyFilters.CreationTime 
                        ||| NotifyFilters.DirectoryName
                        ||| NotifyFilters.FileName
                        ||| NotifyFilters.LastWrite
                        ||| NotifyFilters.Size
    fsw.EnableRaisingEvents <- true
    // TODO run Changed
    // TODO perhaps with sso because of performance
    // TODO check thread is stopping
    fsw.Changed.Add <| sendEvent Changed
    fsw.Created.Add <| sendEvent Created
    fsw.Deleted.Add <| sendEvent Deleted
    fsw.Renamed.Add <| sendEvent Renamed
    
    {
        Id = id
        Path = path
        Dispose = (fun () -> 
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
     


