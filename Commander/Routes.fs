module Routes 

open Giraffe
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Cors
open Microsoft.Extensions.Logging
open System

open Configuration
open Engine
open FileSystem
open GiraffeTools
open Requests

let configureCors (builder: Infrastructure.CorsPolicyBuilder) =
    let SetIsOriginAllowed (origin: string) =
        origin = "http://localhost:20000"

    builder.SetIsOriginAllowed SetIsOriginAllowed |> ignore
    builder.AllowAnyHeader () |> ignore

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
            route  "/commander/getitems"           >=> warbler (fun _ -> getItems ())
            route  "/commander/geticon"            >=> bindQuery<FileRequest> None getIcon
            route  "/commander/getfilepath"        >=> warbler (fun _ -> getFilePath ())
            route  "/commander/sendbounds"         >=> bindJson<WindowBounds> sendBounds
            route  "/commander/image"              >=> bindQuery<FileRequest> None getImage
            route  "/commander/movie"              >=> bindQuery<FileRequest> None getMovie
            route  "/commander/file"               >=> bindQuery<FileRequest> None getFile
            route  "/commander/getactionstexts"    >=> warbler (fun _ -> getActionTexts ())
            route  "/commander/deleteitems"        >=> warbler (fun _ -> deleteItems ())
            route  "/commander/createfolder"       >=> warbler (fun _ -> createFolder ())
            route  "/commander/renameitem"         >=> warbler (fun _ -> renameItem ())
            route  "/commander/getcopyconflicts"   >=> warbler (fun _ -> getCopyConflicts ())
            route  "/commander/showdevtools"       >=> warbler (fun _ -> showDevTools ())
            route  "/commander/showfullscreen"     >=> warbler (fun _ -> showFullscreen ())
            route  "/commander/maximize"           >=> warbler (fun _ -> maximize ())
            route  "/commander/minimize"           >=> warbler (fun _ -> minimize ())
            route  "/commander/restore"            >=> warbler (fun _ -> restore ())
            route  "/commander/fullscreen"         >=> warbler (fun _ -> fullscreen true)
            route  "/commander/fullscreenoff"      >=> warbler (fun _ -> fullscreen false)
            route  "/commander/electronmaximize"   >=> warbler (fun _ -> electronMaximize ())
            route  "/commander/electronunmaximize" >=> warbler (fun _ -> electronUnmaximize ())
            route  "/commander/close"              >=> warbler (fun _ -> close ())
            route  "/commander/putremotes"         >=> bindJson<Remotes> putRemotes
            route  "/commander/getevents"          >=> warbler (fun _ -> getEvents ())
            route  "/commander/sse"                >=> warbler (fun _ -> sse ())
            route  "/commander/sseLeft"            >=> warbler (fun _ -> sseLeftFolder ())
            route  "/commander/sseRight"           >=> warbler (fun _ -> sseRightFolder ())
            route  "/commander/check"              >=> warbler (fun _ -> check ())
            route  "/"                             >=> warbler (fun _ -> streamData false (getResource "web/index.html") None None)
            routePathes ()                      <| httpHandlerParam getResourceFile 
        ]       
    app
        .UseResponseCompression()
        .UseCors(configureCors)
        .UseGiraffe routes      
     
