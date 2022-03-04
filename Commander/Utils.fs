module Utils

open Giraffe
open Microsoft.AspNetCore.Http
open System

let tee f x = 
    f x
    x

let memoizeSingle funToMemoize =
    let memoized = funToMemoize ()
    (fun () -> memoized)

let takeFirstTupleElem (a, _) = a

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

// TODO Giraffe Utils
let httpHandlerParam httpHandler param: HttpHandler = (fun () -> httpHandler(param))()
let routePathes () (routeHandler : string -> HttpHandler) : HttpHandler =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        Some (SubRouting.getNextPartOfPath ctx)
        |> function
            | Some subpath -> routeHandler subpath[1..] next ctx    
            | None         -> skipPipeline