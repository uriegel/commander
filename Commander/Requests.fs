module Requests
open System
open Microsoft.AspNetCore.Http
open Giraffe
open Types
open Tracks
open RequestResult

let getIcon: HttpFunc->HttpContext->HttpFuncResult =
    route "/requests/geticon" >=> bindQuery<FileRequest> None Requests.sendIcon

let getFile: HttpFunc->HttpContext->HttpFuncResult =
    let getFile (fileRequest: FileRequest) = 
        let useRange = fileRequest.Path.EndsWith(".mp4", StringComparison.InvariantCultureIgnoreCase) 
                    || fileRequest.Path.EndsWith(".mp3", StringComparison.InvariantCultureIgnoreCase)
        streamFile useRange fileRequest.Path None None

    route "/requests/file" >=> bindQuery<FileRequest> None getFile

let getTrackInfo (input: FileRequest) =
    returnReqVal <|TrackInfo.Get input.Path
