module Requests

open Giraffe
open System.Text.Json.Serialization

[<JsonFSharpConverter>]
type WindowBounds = {
    X: int option
    Y: int option
    Width: int
    Height: int
    IsMaximized: bool
    Text: string
}

let sendBounds (windowBounds: WindowBounds) = 
    text "{}"
    
    