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

let returnReqTaskResult (resTask: Task<Result<'a, ErrorType>>) = 
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

let fromIOError ioError=
    {
        status = ioError
        statusText = 
            Some 
                (match ioError with
                | IOError.AccessDenied -> "Access denied"
                | IOError.AlreadyExists -> "Already exists"
                | IOError.FileNotFound -> "File not found"
                | IOError.DeleteToTrashNotPossible -> "Delete to trash not possible"
                | IOError.Exn -> "Exception"
                | IOError.NetNameNotFound -> "Net name not found"
                | IOError.PathNotFound -> "Path not found"
                | IOError.NotSupported -> "Not supported"
                | IOError.PathTooLong -> "Path too long"
                | IOError.Canceled -> "Canceled"
                | IOError.WrongCredentials -> "Wrong credentials"
                | IOError.OperationInProgress -> "Operation in Progress"
                | _ -> "Unknown")
    }

let toTask a =
    task {
        return a
    }