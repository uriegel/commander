module PlatformRequests

open Giraffe
open Microsoft.AspNetCore.Http

open PlatformDirectory

let getIcon: string -> HttpHandler = 
    fun (fileExt: string) (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let startTime = Directory.getStartDateTime ()
            let! iconStream = getIcon fileExt
            return! (streamData false iconStream None <| Some startTime) next ctx
        }    
   
