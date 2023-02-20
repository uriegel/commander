module MainEvents
open System.Reactive.Subjects
open Microsoft.AspNetCore.Http
open System.Threading.Tasks
open Giraffe

type MainEvent = 
    | ShowDevTools 
    | ShowFullscreen
    | Maximize
    | Minimize
    | Restore
    | Close
    | Theme of string
    | StartDrag of string[]

let mainReplaySubject = new Subject<MainEvent>()            

let showDevTools () =
    mainReplaySubject.OnNext ShowDevTools
    text "{}"

let showFullscreen () =
    mainReplaySubject.OnNext ShowFullscreen
    text "{}"

let changeTheme theme = 
    Theme theme
    |> mainReplaySubject.OnNext 
    text "{}"

let getEvents () = 
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let tcs = TaskCompletionSource<MainEvent>()
            use subscription = mainReplaySubject.Subscribe (fun evt -> tcs.SetResult(evt))
            let! evt = tcs.Task
            return! json evt next ctx
        }
