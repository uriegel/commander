module Routes 

open Giraffe
open GiraffeTools
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Cors
open Microsoft.Extensions.Logging
open System

open Configuration
open FileSystem
open Directory

let configureCors (builder: Infrastructure.CorsPolicyBuilder) =
    builder
        .WithOrigins("http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod() 
        |> ignore

let configure (app : IApplicationBuilder) = 
    let getMimeType path = 
        match getExtension path with
        | Some ".js"  -> "text/javascript"
        | Some ".css" -> "text/css"
        | _           -> "text/plain"
        
    let getResourceFile path = 
        setContentType <| getMimeType path     >=> streamData false (getResource <| sprintf "web/%s" path) None None

    let routes =
        choose [  
            route  "/commander/getfiles" >=> warbler (fun _ -> getFiles ())
            route  "/commander/geticon"  >=> bindQuery<IconRequest> None getIconRequest
            routef "/static/js/%s"     (fun _ -> httpHandlerParam getResourceFile "scripts/script.js")
            routef "/static/css/%s"    (fun _ -> httpHandlerParam getResourceFile "styles/style.css")
            route  "/"                   >=> warbler (fun _ -> streamData false (getResource "web/index.html") None None)
            routePathes () <| httpHandlerParam getResourceFile 
        ]       
    app
        .UseResponseCompression()
        .UseCors(configureCors)
        .UseGiraffe routes      
     
