module Start
open System
open FSharpTools.Functional

let retrieveStartTime () = DateTimeOffset.Now

let getStartTime = memoizeSingle retrieveStartTime 