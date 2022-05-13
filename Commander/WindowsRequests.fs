module PlatformRequests

open Giraffe
open Microsoft.AspNetCore.Http

open Engine
open PlatformDirectory

let getIcon: FileRequest -> HttpHandler = 
    fun param (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let startTime = Configuration.getStartDateTime ()
            let! iconStream = getIcon param.Path
            return! (streamData false iconStream None <| Some startTime) next ctx
        }    
   
