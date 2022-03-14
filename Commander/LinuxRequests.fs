module PlatformRequests

open Giraffe

open Engine
open PlatformDirectory

let getIcon: GetIcon -> HttpHandler = 
    let startTime = Directory.getStartDateTime ()
    let getIconFile iconFile = streamFile false iconFile None <| Some startTime
    getIcon >> getIconFile