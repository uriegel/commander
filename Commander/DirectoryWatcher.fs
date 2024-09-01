module DirectoryWatcher

type DirectoryWatcher = {
    Id: string
    Path: string
    Dispose: unit->unit
}

let monitor = obj()
let mutable private watchers = Map.empty<string, DirectoryWatcher> 

let private createWatcher id (path: string) = 
    {
        Id = id
        Path = path
        Dispose = (fun () -> ())
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
     


