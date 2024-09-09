module Elevated
open System
open System.Diagnostics
open System.IO
open System.IO.Pipes
open System.Threading.Tasks
open FSharpTools
open FSharpTools.TaskResult
open Giraffe
open Types
open RequestResult

let private pipeName = "$$$commanderPipe$$$"

let serializer = WebWindowNetCore.CustomJsonSerializer() :> Json.ISerializer

let tryElevatedOnAccessDenied<'a, 'b> 
        (method: string)
        (func: 'a->TaskResult<'b, ErrorType>) 
        (input: 'a): Task<JsonResult<'b, ErrorType>> = 

    let startElevatedProcess () =
        let startInfo = new ProcessStartInfo()
        startInfo.FileName <- "Commander.exe"
        startInfo.Arguments <- pipeName   // Pass the pipe name as an argument
        startInfo.UseShellExecute <- true // Must be true to use 'runas'
        startInfo.Verb <- "runas"         // Elevate with UAC
        startInfo.CreateNoWindow <- true
        try
            Process.Start(startInfo) |> ignore
        with
        | _ -> Console.WriteLine("Failed to start elevated process")

    let runElevated () =
        startElevatedProcess ()
        use pipeServer = new NamedPipeServerStream(pipeName, PipeDirection.InOut)
        pipeServer.WaitForConnection() // Wait for the elevated process to connect
        use reader = new StreamReader(pipeServer)
        use writer = new StreamWriter(pipeServer)
        writer.AutoFlush <- true
        // Send data to the elevated process
        writer.WriteLine(method)
        writer.WriteLine(serializer.SerializeToString(input))
        // Receive response from the elevated process
        serializer.Deserialize<JsonResult<'b, ErrorType>>(reader.ReadLine())
        |> fromJsonResult

    let tryElevatedOnAccessDenied (e: ErrorType) = 
        if e.status = IOError.AccessDenied then
            runElevated ()
        else
            Error e

    func input
    |> TaskResult.bindToOk tryElevatedOnAccessDenied
    |> toResult
    |> returnReqTaskResult

let runServer pipeName = 
    use pipeClient = new NamedPipeClientStream(".", pipeName, PipeDirection.InOut)
    pipeClient.Connect() // Connect to the server

    use reader = new StreamReader(pipeClient)
    use writer = new StreamWriter(pipeClient)
    writer.AutoFlush <- true
    let res =
        match reader.ReadLine() with
        | "renameItem" -> 
            let param = serializer.Deserialize<RenameItemParam> (reader.ReadLine())
            Directory.renameItem param
        | "deleteItems" -> 
            let param = serializer.Deserialize<DeleteItemsParam> (reader.ReadLine())
            Directory.deleteItems param
        | _ -> failwith "method not supported"
        |> TaskResult.toResult
    let res = res.Result |> toJsonResult
    let resstr = serializer.SerializeToString res
    writer.WriteLine(resstr)
