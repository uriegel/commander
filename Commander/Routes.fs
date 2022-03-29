module Routes 

open Giraffe
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.Logging
open System

open Configuration
open Engine
open FileSystem
open GiraffeTools
open PlatformRequests
open Requests

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
            route  "/commander/getitems"       >=> warbler (fun _ -> getItems ())
            route  "/commander/geticon"        >=> bindQuery<FileRequest> None getIcon
            route  "/commander/getfilepath"    >=> warbler (fun _ -> getFilePath ())
            route  "/commander/sendbounds"     >=> bindJson<WindowBounds> sendBounds
            route  "/commander/image"          >=> bindQuery<FileRequest> None getImage
            route  "/commander/movie"          >=> bindQuery<FileRequest> None getMovie
            route  "/commander/file"           >=> bindQuery<FileRequest> None getFile
            route  "/commander/getactionstexts">=> warbler (fun _ -> getActionTexts ())
            route  "/commander/createfolder"   >=> warbler (fun _ -> createFolder ())
            route  "/commander/showdevtools"   >=> warbler (fun _ -> showDevTools ())
            route  "/commander/showfullscreen" >=> warbler (fun _ -> showFullscreen ())
            route  "/commander/putremotes"     >=> bindJson<Remotes> putRemotes
            route  "/commander/getevents"      >=> warbler (fun _ -> getEvents ())
            route  "/commander/sse"            >=> warbler (fun _ -> sse ())
            route  "/commander/sseLeft"        >=> warbler (fun _ -> sseLeftFolder ())
            route  "/commander/sseRight"       >=> warbler (fun _ -> sseRightFolder ())
            route  "/"                         >=> warbler (fun _ -> streamData false (getResource "web/index.html") None None)
            routePathes ()                      <| httpHandlerParam getResourceFile 
        ]       
    app
        .UseResponseCompression()
        .UseGiraffe routes      
     
