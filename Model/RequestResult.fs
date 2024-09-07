module RequestResult
open Types
open System.Threading.Tasks

let returnReqVal a = 
    task {
        return {
            Ok = Some a
            Err = None
        }
    }

let returnReqResult a = 
    let res = 
        match a with
        | Ok ok -> {
                Ok = Some ok
                Err = None
            }
        | Error err -> {
                Ok = None
                Err = Some err
            }
    task {
        return res
    }

let returnReqTaskResult (resTask: Task<Result<Unit, ErrorType>>) = 
    task {
        let! res = resTask
        return 
            match res with
            | Ok ok -> {
                    Ok = Some ok
                    Err = None
                }
            | Error err -> {
                    Ok = None
                    Err = Some err
                }
    }

let returnReqNone () = 
    task {
        return {
            Ok = Some { Nil = None}
            Err = None
        }
    }
