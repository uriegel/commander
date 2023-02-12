module Gtk

open FileSystem
open FSharpTools
open GtkDotNet
open System.Reactive.Subjects
open System.Threading.Tasks

open FSharpTools
open Functional
open Result

type IconQueueItem = {
    Extension: string
    Tcs:       TaskCompletionSource<string>
}

type TrashQueueItem = {
    Items:     string array
    Tcs:       TaskCompletionSource<Result<unit, IOError>>
}

type GtkQueueItem = 
    | Icon of IconQueueItem
    | Trash of TrashQueueItem

let private subject = new ReplaySubject<GtkQueueItem> 10

let errorFromGException (gee: GErrorException) = 
    match gee.Code with
    | 1  -> FileNotFound
    | 2  -> AlreadyExists
    | 14 -> AccessDenied
    | 15 -> DeleteToTrashNotPossible
    | _  -> Exception gee.Message

let mapToIOError (e: exn) =
    match e with
    | :? GErrorException as gee -> errorFromGException gee
    | _                         -> Exception e.Message

let trash file = 
    exceptionToResult <| fun () -> GFile.Trash file
    |> mapError mapToIOError

let start = 
    let start () = 
        async {
            Raw.Gtk.Init ()

            let messageLoop (inbox: MailboxProcessor<GtkQueueItem>) = 
                let rec messageLoop () = async {
                    match! inbox.Receive() with
                    | Icon  item -> 
                        use iconInfo = IconInfo.Choose (item.Extension, 16, IconLookup.NoSvg)
                        item.Tcs.SetResult <| iconInfo.GetFileName ()
                        return! messageLoop ()
                    | Trash item -> 

                        let trashIfNoError (result: Result<unit, IOError>) file =
                            match result with
                            | Ok _      -> trash file
                            | Error err -> Error err

                        let result = item.Items |> Array.fold trashIfNoError (Ok ())
                        item.Tcs.SetResult <| result
                        
                        return! messageLoop ()
                }
                messageLoop ()
            
            let agent = MailboxProcessor.Start messageLoop
            let onValue evt = agent.Post evt
            subject |> Observable.subscribe onValue |> ignore

            // Wait forever
            let tcs = TaskCompletionSource<obj> ()
            tcs.Task.Wait ()
            return ()
        } |> Async.Start

    memoizeSingle start

let private monitor = new obj()

let getIcon ext = 

    start()

    let getIcon () = 
        let tcs = TaskCompletionSource<string> ()
        subject.OnNext <| Icon { Extension = ext; Tcs = tcs }
        tcs.Task.Result
    
    lock monitor getIcon
    
let deleteItems items =
    
    start()

    let deleteItems () = 
        let tcs = TaskCompletionSource<Result<unit, IOError>> ()
        subject.OnNext <| Trash { Items = items; Tcs = tcs }
        tcs.Task.Result  
    
    lock monitor deleteItems
