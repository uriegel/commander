module RequestResult
open Types

let returnReqVal a = 
    task {
        return {
            Ok = Some a
            Err = None
        }
    }

let returnReqNone () = 
    task {
        return {
            Ok = Some { Nil = None}
            Err = None
        }
    }
