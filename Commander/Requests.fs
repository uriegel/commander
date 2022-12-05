module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System.Threading.Tasks
open Theme
open WindowBounds

open Configuration
open Engine
open Engines
open ExtendedRename
open FolderEvents
open System.Reactive.Subjects
open System.Text.Json
open Model
open FSharpTools.Directory

type StartDragParam = {
    Items: string[]
    Path:  string
}

type MainEvent = 
    | ShowDevTools 
    | ShowFullscreen
    | Maximize
    | Minimize
    | Restore
    | Close
    | StartDrag of string[]

type Remotes = {
    Remotes: Remotes.Remote[]
}

type GetActionsTextsResult = {
    Result: string option
}

type CheckExtendedRenameResult = {
    Result: bool
}

let mainReplaySubject = new Subject<MainEvent>()

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
            let result: GetActionsTextsResult = { Result = getActionsTexts param }
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

let checkExtendedRename () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<CheckExtendedRenameParam>(body, getJsonOptions ())
            let isSupported = checkExtendedRename param
            let result: CheckExtendedRenameResult = { Result = isSupported }
            return! json result next ctx
        }        

let deleteItems () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<DeleteItemsParam>(body, getJsonOptions ())
            let result = deleteItems param
            return! Json.text result next ctx
        }              

let prepareFileCopy () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let files = JsonSerializer.Deserialize<string[]>(body, getJsonOptions ())
            let result = prepareFileCopy files
            return! Json.text result next ctx
        }              

let prepareCopy () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param: PrepareCopyItemsParam = JsonSerializer.Deserialize<PrepareCopyItemsParam>(body, getJsonOptions ())
            let! result = prepareCopy param
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

let cancelCopy () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<PostCopyItemsParam>(body, getJsonOptions ())
            let result = cancelCopy param
            return! Json.text result next ctx
        }              

let renameItems () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<RenameItemsParam>(body, getJsonOptions ())
            let result = renameItems param
            return! Json.text result next ctx
        }              

let startDrag () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<StartDragParam>(body, getJsonOptions ())
            let pathAppend = combine2Pathes param.Path
            let param2 = 
                param.Items
                |> Array.map pathAppend
            mainReplaySubject.OnNext <| StartDrag param2
            return! Json.text "{}" next ctx
        }              

let getImage (fileRequest: FileRequest) = 
    streamFile false fileRequest.Path None None

let getMovie (fileRequest: FileRequest) = 
    streamFile true fileRequest.Path None None

let getFile (fileRequest: FileRequest) = 
    streamFile false fileRequest.Path None None

let putRemotes (remotes: Remotes) = 
    Remotes.put remotes.Remotes
    text "{}"

