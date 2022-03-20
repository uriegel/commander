module Gtk

open GtkDotNet
open System.Reactive.Subjects

open Utils
open System.Threading.Tasks

type GtkQueueItem = {
    Extension: string
    Tcs:       TaskCompletionSource<string>
}

let private subject = new ReplaySubject<GtkQueueItem> 10

let start = 
    let start () = 
        async {
            Raw.Gtk.Init ()

            let messageLoop (inbox: MailboxProcessor<GtkQueueItem>) = 
                let rec messageLoop () = async {
                    let! evt = inbox.Receive()
                    use iconInfo = IconInfo.Choose (evt.Extension, 16, IconLookup.NoSvg)
                    evt.Tcs.SetResult <| iconInfo.GetFileName ()
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
        subject.OnNext { Extension = ext; Tcs = tcs }
        tcs.Task.Result
    
    lock monitor getIcon
    

