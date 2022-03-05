module Requests

open Giraffe
open Microsoft.AspNetCore.Http

open Configuration

type EventMethod = 
    | ShowDevTools = 1

type Events = {
    Method: EventMethod
}

let sendBounds (windowBounds: WindowBounds) = 
    saveBounds windowBounds
    text "{}"
    
let showDevTools () =
    text "{}"
    
let getEvents () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            do! System.Threading.Tasks.Task.Delay 10000
            return! json { Method = EventMethod.ShowDevTools } next ctx
        }
  
