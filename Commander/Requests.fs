module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System.Threading.Tasks

open Configuration
open Utils
open System.Reactive.Subjects

type MainEventMethod = 
    | ShowDevTools = 1
    | ShowFullscreen = 2

type MainEvents = {
    Method: MainEventMethod
}

type RendererEventMethod = 
    | ShowDevTools = 1
    | ShowFullscreen = 2

type RendererEvents = {
    Method: MainEventMethod
}

let mainReplaySubject = new Subject<MainEvents>()
let rendererReplaySubject = new Subject<RendererEvents>()

let sendBounds (windowBounds: WindowBounds) = 
    saveBounds windowBounds
    text "{}"
    
let showDevTools () =
    mainReplaySubject.OnNext({ Method = MainEventMethod.ShowDevTools })
    text "{}"

let showFullscreen () =
    mainReplaySubject.OnNext({ Method = MainEventMethod.ShowFullscreen })
    text "{}"
    
let getEvents () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let tcs = TaskCompletionSource<MainEvents>()
            use subscription = mainReplaySubject.Subscribe (fun evt -> tcs.SetResult(evt))
            let! evt = tcs.Task
            return! json evt next ctx
        }
  
let sse () = createSse rendererReplaySubject <| getJsonOptions ()
