    module PlatformRequests

open Giraffe

open PlatformDirectory

let getIcon: string -> HttpHandler = 
    let startTime = Directory.getStartDateTime ()
    let getIconFile iconFile = streamFile false iconFile None <| Some startTime
    getIcon >> getIconFile