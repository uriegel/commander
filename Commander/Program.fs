open FSharpTools

printfn "Hello Commander"

let logError formatString res = async {
    match res with
    | Ok _    -> ()
    | Error e -> printfn formatString e 
    return ()
}

let processResultTResult (res: Process.ProcessResult) = async {
    return 
        match res with
        | { Error = None; Exception = None; ExitCode = Some c } when c = 0 -> Ok ()
        | { ExitCode = Some c; Error = Some e } when c <> 0                -> Error (sprintf "Error code: %d, %s" c <| String.trim e)
        | { ExitCode = Some c; Error = None } when c <> 0                  -> Error (sprintf "Error code: %d" c)
        | { Error = Some err }                                             -> Error err
        | { Exception = Some e}                                            -> Error (e.ToString())
        | _                                                                -> Error "Unknown error"
}

let (>>) f g x = async {
    let! y = f x
    let! e = g y
    return e
}

let startElectron = Process.run "electron" >> processResultTResult >> logError "Electron konnte nicht gestartet werden: %s"

async {
    do! startElectron "http://google.de"
} |> Async.RunSynchronously

//TODO typescript electron main
//TODO Dotnet F# exe (Windows winexe) Giraffe
//TODO index and css and styles in Resource, served by Giraffe
//TODO Start electron http://localhost:9865/commander?x=23&y=45&w=234&h=234&isMaximized, wait for electron exit
//TODO Windows and Linux
//TODO typescript renderer script


