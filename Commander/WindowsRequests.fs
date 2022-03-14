module PlatformRequests

open Giraffe
open Microsoft.AspNetCore.Http

open Engine
open PlatformDirectory

let getIcon: GetIcon -> HttpHandler = 
    fun param (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let startTime = Directory.getStartDateTime ()
            let! iconStream = getIcon param.Path
            return! (streamData false iconStream None <| Some startTime) next ctx
        }    
   
