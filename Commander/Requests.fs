module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System.Threading.Tasks

open Configuration
open Utils

type EventMethod = 
    | ShowDevTools = 1
    | ShowFullscreen = 2

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

let showFullscreen () =
    observable.Trigger({ Method = EventMethod.ShowFullscreen })
    text "{}"
    
let getEvents () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let tcs = TaskCompletionSource<Events>()
            use subscription = observable.Publish.Subscribe (fun evt -> tcs.SetResult(evt))
            let! evt = tcs.Task
            return! json evt next ctx
        }
  
let sse () = createSse observable.Publish <| getJsonOptions ()
