module Routes 

open Giraffe
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.Logging
open System

open Configuration
open Utils

type Cmd = {
    Name: string
    Id: int
}
type Result = {
    Result: int
    Description: string
}

let configure (app : IApplicationBuilder) = 
    let getResourceFile path = 
        setContentType "text/css" >=> streamData false (getResource <| sprintf "web/%s" path) None None

    let routes =
        choose [  
            route  "/commander" >=> bindJson<Cmd> (fun cmd -> 
                json { Result = 2345; Description ="Schönes Ergebnis" }
            )
            route  "/"    >=> warbler (fun _ -> streamData false (getResource "web/index.html") None None)
            routePathes () <| httpHandlerParam getResourceFile 
        ]       
    app.UseGiraffe routes      
