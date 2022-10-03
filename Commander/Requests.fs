module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System.Threading.Tasks
open Theme
open WindowBounds

open Configuration
open Engine
open Engines
open FolderEvents
open System.Reactive.Subjects
open System.Text.Json

type MainEvent = 
    | ShowDevTools 
    | ShowFullscreen
    | Maximize
    | Minimize
    | Restore
    | Close

type RendererEvent = 
    | ThemeChanged of string
    | ElectronMaximize 
    | ElectronUnmaximize 
    | Fullscreen of bool
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

let startThemeDetection () = 
    let onChanged theme = rendererReplaySubject.OnNext (ThemeChanged theme)
    startThemeDetection onChanged

let sendBounds (windowBounds: WindowBounds) = 
    saveBounds windowBounds
    text "{}"
    
let showDevTools () =
    mainReplaySubject.OnNext ShowDevTools
    text "{}"

let showFullscreen () =
    mainReplaySubject.OnNext ShowFullscreen
    text "{}"

let maximize () =
    mainReplaySubject.OnNext Maximize
    text "{}"

let electronMaximize () =
    rendererReplaySubject.OnNext ElectronMaximize  
    text "{}"

let electronUnmaximize () =
    rendererReplaySubject.OnNext ElectronUnmaximize  
    text "{}"

let minimize () =
    mainReplaySubject.OnNext Minimize
    text "{}"

let restore () = 
    mainReplaySubject.OnNext Restore
    text "{}"

let fullscreen on = 
    rendererReplaySubject.OnNext <| Fullscreen on
    text "{}"

let close () =
    mainReplaySubject.OnNext Close
    text "{}"

let check () = text "Living"    

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

let renameItem () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<RenameItemParam>(body, getJsonOptions ())
            let result = renameItem param
            return! Json.text result next ctx
        }        

let deleteItems  () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<DeleteItemsParam>(body, getJsonOptions ())
            let result = deleteItems param
            return! Json.text result next ctx
        }              

let prepareCopy () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<CopyItemsParam>(body, getJsonOptions ())
            let result = prepareCopy param
            return! Json.text result next ctx
        }              

let copyItems () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<CopyItemsParam>(body, getJsonOptions ())
            let result = copyItems param
            return! Json.text result next ctx
        }              

let postCopyItems () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<PostCopyItemsParam>(body, getJsonOptions ())
            let result = postCopyItems param
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

