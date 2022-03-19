module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System.Threading.Tasks

open Configuration
open Directory
open Engine
open Engines
open Utils
open System.Reactive.Subjects
open System.Text.Json

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

let sseLeftFolder () = createSse leftFolderReplaySubject <| getJsonOptions ()
let sseRightFolder () = createSse rightFolderReplaySubject <| getJsonOptions ()

let getItems () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<GetItems>(body, getJsonOptions ())
            let! result = getItems param body
            return! jsonText result next ctx
        }

let getFilePath () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<GetFile>(body, getJsonOptions ())
            let! result = getFilePath param body
            return! jsonText result next ctx
        }

let getImage (fileRequest: FileRequest) = 
    streamFile false fileRequest.Path None None
