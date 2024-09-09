module Directory
open Types 
open FSharpTools
open FSharpTools.TaskResult

let renameItem (input: RenameItemParam) = 
    Directory.move (input.Path |> Directory.attachSubPath input.Name, input.Path |> Directory.attachSubPath input.NewName)
    |> Result.mapError exceptionToError
    |> toTaskResult


