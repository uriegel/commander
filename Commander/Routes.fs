module Routes 

open Giraffe
open GiraffeTools
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Cors
open Microsoft.AspNetCore.Http
open Microsoft.Extensions.Logging
open System
open System.Text.Json

open Configuration
open FileSystem
open Directory
open Root

let configureCors (builder: Infrastructure.CorsPolicyBuilder) =
    builder
        .WithOrigins("http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod() 
        |> ignore

let getExtendedItems () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<GetExtendedItems>(body, getJsonOptions ())
            let! result = Directory.getExtendedItems param
            return! Json.text result next ctx
        }

let configure (app : IApplicationBuilder) = 
    let getMimeType path = 
        match getExtension path with
        | Some ".js"  -> "text/javascript"
        | Some ".css" -> "text/css"
        | _           -> "text/plain"
        
    let getResourceFile path = 
        setContentType <| getMimeType path     >=> streamData false (getResource <| sprintf "web/%s" path) None None

    let getRoot () =
        fun (next : HttpFunc) (ctx : HttpContext) ->
            task {
                let! body = ctx.ReadBodyFromRequestAsync ()
                let! result = getRoot ()
                return! Json.text result next ctx
            }

    let routes =
        choose [  
            route  "/commander/getfiles"         >=> warbler (fun _ -> getFiles ())
            route  "/commander/getroot"          >=> warbler (fun _ -> getRoot ())
            route  "/commander/geticon"          >=> bindQuery<FileRequest> None getIconRequest
            route  "/commander/image"            >=> bindQuery<FileRequest> None getImage
            route  "/commander/getextendeditems" >=> warbler (fun _ -> getExtendedItems ())
            routef "/static/js/%s" (fun _ -> httpHandlerParam getResourceFile "scripts/script.js")
            routef "/static/css/%s" (fun _ -> httpHandlerParam getResourceFile "styles/style.css")
            route  "/"                           >=> warbler (fun _ -> streamData false (getResource "web/index.html") None None)
            routePathes () <| httpHandlerParam getResourceFile 
        ]       
    app
        .UseResponseCompression()
        .UseCors(configureCors)
        .UseGiraffe routes      
     
