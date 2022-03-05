module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System.Threading.Tasks

open Configuration

type EventMethod = 
    | ShowDevTools = 1

type Events = {
    Method: EventMethod
}

let observable = new Event<Events>()

let sendBounds (windowBounds: WindowBounds) = 
    saveBounds windowBounds
    text "{}"
    
let showDevTools () =
    observable.Trigger({ Method = EventMethod.ShowDevTools })
    text "{}"
    
let getEvents () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let tcs = TaskCompletionSource<Events>()
            use subscription = observable.Publish.Subscribe (fun evt -> tcs.SetResult(evt))
            let! evt = tcs.Task
            return! json evt next ctx
        }
  
