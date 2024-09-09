module Elevated
open System.Threading.Tasks
open Types
open RequestResult
open FSharpTools.TaskResult

let tryElevatedOnAccessDenied<'a, 'b> (func: 'a->TaskResult<'b, ErrorType>) (input: 'a) : Task<JsonResult<'b, ErrorType>> = 

    let tryElevatedOnAccessDenied (e: ErrorType) = Error e

    func input
    |> TaskResult.bindToOk tryElevatedOnAccessDenied
    |> toResult
    |> returnReqTaskResult