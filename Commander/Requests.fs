module Requests

open Giraffe

type WindowBounds = {
    X: int option
    Y: int option
    Width: int
    Height: int
    IsMaximized: bool
}

let sendBounds (windowBounds: WindowBounds) = 
    text "{}"
    
    