module Utils

open FSharpRailway.Option
open FSharpTools
open Microsoft.AspNetCore.Http
open System
open System.Text.Json
open System.Threading.Tasks

let tee f x = 
    f x
    x

let memoizeSingle funToMemoize =
    let memoized = funToMemoize ()
    (fun () -> memoized)

let takeFirstTupleElem (a, _) = a

let parseInt64 defaultValue (str: string) = 
    match Int64.TryParse str with
    | true, num -> num
    | _         -> defaultValue

let combine2Pathes path1 path2 = IO.Path.Combine (path1, path2)
let combine3Pathes path1 path2 path3 = IO.Path.Combine (path1, path2, path3)
let createStream path : IO.Stream = IO.File.Create path
let openStream path : IO.Stream = IO.File.OpenRead path

let checkDirectory path = 
    let info = IO.FileInfo path
    if not info.Directory.Exists then 
        IO.Directory.CreateDirectory info.DirectoryName |> ignore
    path

let securedCreateStream = checkDirectory >> createStream
let securedOpenStream = checkDirectory >> openStream

let getExtension file =
    let getExtensionIndex () = file |> String.lastIndexOfChar '.'
    let getExtensionFromIndex index = Some (file |> String.substring index)
    let getExtension = getExtensionIndex >=> getExtensionFromIndex
    getExtension ()

let toDateTime (timestamp: int64) =
    let start = DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)
    start.AddMilliseconds(float timestamp).ToLocalTime()

let getCharCount char str = 
    let filterSlash chr = chr = char
    str 
    |> Seq.filter filterSlash
    |> Seq.length

open Giraffe

// TODO Giraffe Utils
let httpHandlerParam httpHandler param: HttpHandler = (fun () -> httpHandler(param))()
let routePathes () (routeHandler : string -> HttpHandler) : HttpHandler =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        Some (SubRouting.getNextPartOfPath ctx)
        |> function
            | Some subpath -> routeHandler subpath[1..] next ctx    
            | None         -> skipPipeline

let createSse<'a> (observable: IObservable<'a>) (jsonOptions: JsonSerializerOptions) =  

    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let res = ctx.Response
            ctx.SetStatusCode 200
            ctx.SetHttpHeader("Content-Type", "text/event-stream")
            ctx.SetHttpHeader("Cache-Control", "no-cache")

            let messageLoop (inbox: MailboxProcessor<obj>) = 
                let rec messageLoop () = async {
                    let! msg = inbox.Receive()
                    let payload = JsonSerializer.Serialize(msg, jsonOptions)
                    do! res.WriteAsync $"data:{payload}\n\n" |> Async.AwaitTask
                    do! res.Body.FlushAsync() |> Async.AwaitTask
                    return! messageLoop ()
                }
                messageLoop ()
            
            let agent = MailboxProcessor.Start messageLoop
            let onValue evt = agent.Post evt
            observable |> Observable.subscribe onValue |> ignore

            // Wait forever
            let tcs = TaskCompletionSource<'a>()
            let! evt = tcs.Task
            // Only needed for compiling:
            return! text "" next ctx            
        }        

let runCmd cmd args = 
    // TODO from FSharpRailway
    let (>>) f g x = async {
            let! y = f x
            let! e = g y
            return e
        }
    let getStringFromResult (result: FSharpTools.Process.ProcessResult) = async { return result.Output.Value } 
    let runCmd () = FSharpTools.Process.run cmd args
    runCmd >> getStringFromResult

let jsonText (str : string) : HttpHandler =
        let bytes = System.Text.Encoding.UTF8.GetBytes str
        fun (_ : HttpFunc) (ctx : HttpContext) ->
            ctx.SetContentType "application/json; charset=utf-8"
            ctx.WriteBytesAsync bytes
