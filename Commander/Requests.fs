module Requests
open Giraffe
open Microsoft.AspNetCore.Http
open Types
open System

let getIcon: HttpFunc->HttpContext->HttpFuncResult =
    route "/requests/geticon" >=> bindQuery<FileRequest> None Requests.sendIcon

let getFile: HttpFunc->HttpContext->HttpFuncResult =
    let getFile fileRequest = 
        let useRange = fileRequest.Path.EndsWith(".mp4", StringComparison.InvariantCultureIgnoreCase) 
                    || fileRequest.Path.EndsWith(".mp3", StringComparison.InvariantCultureIgnoreCase)
        streamFile useRange fileRequest.Path None None

    route "/requests/file" >=> bindQuery<FileRequest> None getFile
