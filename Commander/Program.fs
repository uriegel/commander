open FSharpTools

printfn "Hello Commander"



async {
    do! Electron.start "dist/main.js"
} |> Async.RunSynchronously

//TODO typescript electron main
//TODO index and css and styles in Resource, served by Giraffe
//TODO Start electron http://localhost:9865/commander?x=23&y=45&w=234&h=234&isMaximized, wait for electron exit
//TODO Windows and Linux
//TODO typescript renderer script


