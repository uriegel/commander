module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System.Threading.Tasks

open Configuration
open Engine
open Engines
open Utils
open System.Reactive.Subjects


// TODO Root
// TODO GetItemsResult: Array with string, number, date or version, in Column description is type
// TODO GetItemsResult: Icon string
// TODO getItems (?path=%path via fetch currentPath, engineId
// TODO Linux and Windows
// TODO returns object with items and optional columns, currentPath, engineId
// TODO items: files unsorted, directories with parent sorted
// TODO Directory

type MainEvent = 
    | ShowDevTools 
    | ShowFullscreen

type RendererEvent = 
    | ThemeChanged of string
    | Nothing

let mainReplaySubject = new Subject<MainEvent>()
let rendererReplaySubject = new Subject<RendererEvent>()

let sendBounds (windowBounds: WindowBounds) = 
    saveBounds windowBounds
    text "{}"
    
let showDevTools () =
    mainReplaySubject.OnNext ShowDevTools
    text "{}"

let showFullscreen () =
    mainReplaySubject.OnNext ShowFullscreen
    text "{}"

let getEvents () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let tcs = TaskCompletionSource<MainEvent>()
            use subscription = mainReplaySubject.Subscribe (fun evt -> tcs.SetResult(evt))
            let! evt = tcs.Task
            return! json evt next ctx
        }
  
let sse () = createSse rendererReplaySubject <| getJsonOptions ()

let getItems param = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! items = Engines.getItems param
            return! json items next ctx
        }
    
