module PlatformRequests

open Giraffe

open Engine
open PlatformDirectory

let getIcon: FileRequest -> HttpHandler = 
    let startTime = Directory.getStartDateTime ()
    let getIconFile iconFile = streamFile false iconFile None <| Some startTime
    getIcon >> getIconFile