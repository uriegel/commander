module Process

open FSharpRailway
open FSharpTools
open Async

let runCmd cmd args = 
    let getStringFromResult (result: Process.ProcessResult) = async { return result.Output.Value } 
    let runCmd () = Process.run cmd args
    runCmd >> getStringFromResult



