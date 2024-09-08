module Types
open GtkDotNet
open Types

let csResultToResult (csResult: CsTools.Functional.Result<'a, 'b>) = 
    csResult.Match(
        (fun n -> Ok n), 
        (fun n -> Error n))

let csNothingResultToResult (csResult: CsTools.Functional.Result<CsTools.Functional.Nothing, 'b>) =         
    csResultToResult csResult
    |> Result.map (fun _ -> ())

let gerrorToError (g: GError) = 
    match g with
    | :? FileError as fe when fe.Error = FileError.ErrorType.AccessDenied -> Types.IOError.AccessDenied
    | :? FileError as fe when fe.Error = FileError.ErrorType.SourceNotFound -> Types.IOError.FileNotFound
    | :? FileError as fe when fe.Error = FileError.ErrorType.TargetNotFound -> Types.IOError.PathNotFound
    | :? FileError as fe when fe.Error = FileError.ErrorType.TargetExisting -> Types.IOError.AlreadyExists
    | :? FileError as fe when fe.Error = FileError.ErrorType.NoDiskSpace -> Types.IOError.NoDiskSpace
    | :? FileError as fe when fe.Error = FileError.ErrorType.Canceled -> Types.IOError.Canceled
    | _ -> Types.IOError.Exn