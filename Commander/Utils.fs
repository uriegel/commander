module Utils

open FSharpRailway.Option
open FSharpTools
open Functional
open Microsoft.AspNetCore.Http
open System
open System.Text.Json
open System.Threading.Tasks

module Directory = 

    let combinePathes pathes = IO.Path.Combine pathes

    let create path = 
        try
            Ok (IO.Directory.CreateDirectory path)
        with
        | e -> Error(e)

    let retrieveConfigDirectory scheme application = 
        [| 
            Environment.GetFolderPath Environment.SpecialFolder.ApplicationData
            scheme
            application
        |] |> combinePathes 

    let getConfigDirectory = memoize retrieveConfigDirectory

module Stream = 
    let create path = 
        try 
            Ok (IO.File.Create (path) :> IO.Stream)
        with
        | e -> Error e

    let openRead path = 
        try 
            Ok (IO.File.OpenRead (path) :> IO.Stream)
        with
        | e -> Error e

let parseInt64 (str: string) = 
    match Int64.TryParse str with
    | true, num -> Some num
    | _         -> None

let parseInt64Def defaultValue = parseInt64 >> Option.defaultValue defaultValue

module Functional = 

    let tee f x = 
        f x
        x

    let memoizeSingle funToMemoize =
        let memoized = funToMemoize ()
        fun () -> memoized

    let takeFirstTupleElem (a, _) = a

module DateTime = 
    
    // TODO seconds, milliseconds
    let fromUnixTime (timestamp: int64) =
        let start = DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        start.AddMilliseconds(float timestamp).ToLocalTime()

module Seq = 

    let getElementCount char str = 
        let filterSlash chr = chr = char
        str 
        |> Seq.filter filterSlash
        |> Seq.length

module String = 
    let getCharCount (char: Char) = Seq.getElementCount char

module Result = 
    let mapErrorToOption result = 
        match result with
        | Ok    _ -> None
        | Error u -> Some u

    let throw result = 
        match result with
        | Ok value -> value
        |Error exn -> raise exn

let checkExistsDirectory path = 
    let info = IO.FileInfo path
    if not info.Directory.Exists then 
        Directory.create info.DirectoryName |> ignore
    path

type IOError = 
| AccessDenied
| AlreadyExists
| Exception of System.Exception

let mapIOError (e: exn) = 
    match e with
    | :? System.UnauthorizedAccessException -> AccessDenied
    | e                                     -> Exception e

let createStream = Stream.create >> Result.throw
let openReadStream = Stream.openRead >> Result.throw

let securedCreateStream = checkExistsDirectory >> createStream
let securedOpenStream = checkExistsDirectory >> openReadStream

let getExtension file =
    let getExtensionIndex () = file |> String.lastIndexOfChar '.'
    let getExtensionFromIndex index = Some (file |> String.substring index)
    let getExtension = getExtensionIndex >=> getExtensionFromIndex
    getExtension ()

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


