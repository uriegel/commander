module Requests

open ClrWinApi
open Giraffe
open Microsoft.AspNetCore.Http
open System

open Engine
open Directory
open Model

let getIcon: FileRequest -> HttpHandler = 
    fun param (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let startTime = Configuration.getStartDateTime ()
            let! iconStream = getIcon param.Path
            return! (streamData false iconStream None <| Some startTime) next ctx
        }    
   
let openItem openType fileName = 

    let mutable execInfo = ShellExecuteInfo()
    execInfo.File <- fileName
    execInfo.Show <- ShowWindowFlag.Show
    execInfo.Mask <- ShellExecuteFlag.InvokeIDList
    execInfo.Size <- sizeof<ShellExecuteInfo>
    execInfo.Verb <- 
        match openType with
        | OpenType.Properties -> "properties" 
        | OpenType.OpenAs     -> "openas" 
        | _                   -> "open"
    ShellExecuteEx &execInfo |> ignore
