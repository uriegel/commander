module RequestResult
open Types

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

let returnReqNone () = 
    task {
        return {
            Ok = Some { Nil = None}
            Err = None
        }
    }
