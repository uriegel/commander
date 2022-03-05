module Requests

open Giraffe

open Configuration

let sendBounds (windowBounds: WindowBounds) = 
    saveBounds windowBounds
    text "{}"
    
let showDevTools () =
    text "{}"
    