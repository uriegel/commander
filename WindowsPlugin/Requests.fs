module Requests

open Giraffe
open Microsoft.AspNetCore.Http
open System

open Engine
open Directory

let getIcon: FileRequest -> HttpHandler = 
    fun param (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let startTime = Configuration.getStartDateTime ()
            let! iconStream = getIcon param.Path
            return! (streamData false iconStream None <| Some startTime) next ctx
        }    
   
let openItem fileName = 
    use proc = new Diagnostics.Process() 
    proc.StartInfo <- Diagnostics.ProcessStartInfo()
    proc.StartInfo.FileName <- fileName
    proc.StartInfo.Verb <- "open"
    proc.StartInfo.UseShellExecute <- true
    proc.Start() |> ignore
