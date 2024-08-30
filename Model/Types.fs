module Types

type Empty = { Nil: int }
type JsonResult<'a, 'b> = { Ok: 'a option; Err: 'b option }

[<CLIMutable>]
type FileRequest = { Path: string }

let toJsonResult (result: Result<'a, 'b>) = 
    match result with
    | Ok ok -> { Ok = Some ok; Err = None }
    | Error err -> { Ok = None; Err = Some err } 

