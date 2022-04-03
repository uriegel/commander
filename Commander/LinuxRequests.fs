module PlatformRequests

open Giraffe
open Microsoft.AspNetCore.Http

open Engine
open PlatformDirectory

let getIcon: FileRequest -> HttpHandler = 
    fun param (next : HttpFunc) (ctx : HttpContext) ->
            task {
                let startTime = Directory.getStartDateTime ()
                let! iconPath = getIcon param.Path
                return! (streamFile false iconPath None <| Some startTime) next ctx
            }    
