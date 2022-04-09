module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System.Threading.Tasks

open Configuration
open Directory
open Engine
open Engines
open System.Reactive.Subjects
open System.Text.Json

type MainEvent = 
    | ShowDevTools 
    | ShowFullscreen

type RendererEvent = 
    | ThemeChanged of string
    | Nothing

type Remotes = {
    FolderId: string
    Remotes: Remotes.Remote[]
}

type GetActionsTextsResult = {
    Result: string option
}

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
  
let sse () = Sse.create rendererReplaySubject <| getJsonOptions ()

let sseLeftFolder () = Sse.create leftFolderReplaySubject <| getJsonOptions ()
let sseRightFolder () = Sse.create rightFolderReplaySubject <| getJsonOptions ()

let getItems () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<GetItems>(body, getJsonOptions ())
            let! result = getItems param body
            return! Json.text result next ctx
        }

let getActionTexts () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<GetActionsTexts>(body, getJsonOptions ())
            let result = { Result = getActionsTexts param }
            return! json result next ctx
        }

let getFilePath () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<GetFile>(body, getJsonOptions ())
            let! result = getFilePath param body
            return! Json.text result next ctx
        }

let createFolder () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<CreateFolderParam>(body, getJsonOptions ())
            let result = createfolder param
            return! Json.text result next ctx
        }        

let deleteItems  () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<DeleteItemsParam>(body, getJsonOptions ())
            let! result = deleteItems param
            return! Json.text result next ctx
        }              

let getImage (fileRequest: FileRequest) = 
    streamFile false fileRequest.Path None None

let getMovie (fileRequest: FileRequest) = 
    streamFile true fileRequest.Path None None

let getFile (fileRequest: FileRequest) = 
    streamFile false fileRequest.Path None None

let putRemotes (remotes: Remotes) = 
    Remotes.put remotes.FolderId remotes.Remotes
    text "{}"

