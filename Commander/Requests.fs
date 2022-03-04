module Requests

open Giraffe

type WindowBounds = {
    X: int option
    Y: int option
    Width: int
    Height: int
    IsMaximized: bool
    Icon: string option
}

let sendBounds (windowBounds: WindowBounds) = 
    text "{}"
    
    