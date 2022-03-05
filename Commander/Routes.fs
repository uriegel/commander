module Routes 

open Giraffe
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.Logging
open System

open Configuration
open Requests
open Utils

let configure (app : IApplicationBuilder) = 
    let getMimeType path = 
        match getExtension path with
        | Some ".js"  -> "text/javascript"
        | Some ".css" -> "text/css"
        | _          -> "text/plain"
        
    let getResourceFile path = 
        setContentType <| getMimeType path >=> streamData false (getResource <| sprintf "web/%s" path) None None
    
    let routes =
        choose [  
            route  "/commander/sendbounds"   >=> bindJson<WindowBounds> sendBounds
            route  "/commander/showdevtools" >=> warbler (fun _ -> showDevTools ())
            route  "/"                       >=> warbler (fun _ -> streamData false (getResource "web/index.html") None None)
            routePathes ()                    <| httpHandlerParam getResourceFile 
        ]       
    app
        .UseResponseCompression()
        .UseGiraffe routes      
     