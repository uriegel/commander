module Requests

open Giraffe
open Microsoft.AspNetCore.Http

open Engine
open Directory
open FSharpTools

let getIcon: FileRequest -> HttpHandler = 
    fun param (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let startTime = Configuration.getStartDateTime ()
            let! (iconPath, mimeType) = getIcon param.Path
            let sendIcon = (setContentType <| mimeType) >=> (streamFile false iconPath None <| Some startTime)
            return! sendIcon next ctx
        }    

let openItem _ fileName = 
    fileName
    |> sprintf "\"%s\""
    |> Process.runCmd "xdg-open"
    |> ignore