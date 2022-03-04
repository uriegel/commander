module Requests

open Giraffe
open Microsoft.AspNetCore.Http

type WindowBounds = {
    x: int
    y: int
    width: int
    height: int
    isMaximized: bool
}

let sendBounds (windowBounds: WindowBounds) = 
    text "{}"
    
    