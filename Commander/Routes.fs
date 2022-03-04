module Routes 

open Giraffe
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.Logging
open System

open Configuration
open Requests
open Utils

let configure (app : IApplicationBuilder) = 
    let getResourceFile path = 
        setContentType "text/css" >=> streamData false (getResource <| sprintf "web/%s" path) None None
    
    let routes =
        choose [  
            route  "/commander/sendbounds" >=> bindJson<WindowBounds> sendBounds
            route  "/"                     >=> warbler (fun _ -> streamData false (getResource "web/index.html") None None)
            routePathes ()                  <| httpHandlerParam getResourceFile 
        ]       
    app.UseGiraffe routes      
     