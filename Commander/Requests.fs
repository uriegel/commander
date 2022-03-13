module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System.Threading.Tasks

open Configuration
open Engine
open Engines
open Utils
open System.Reactive.Subjects
open System.Text.Json
open PlatformDirectory

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

let getItems () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<GetItems>(body, getJsonOptions ())
            let! result = getItems param body
            return! jsonText result next ctx
        }

let getIcon: string -> HttpHandler = 
    let getIconFile iconFile = streamFile false iconFile None None
    PlatformDirectory.getIcon >> getIconFile