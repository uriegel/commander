module Elevated
open System
open System.Threading.Tasks
open Types
open RequestResult
open FSharpTools.TaskResult
open System.Diagnostics
open System.IO.Pipes
open System.IO

let tryElevatedOnAccessDenied<'a, 'b> (func: 'a->TaskResult<'b, ErrorType>) (input: 'a) : Task<JsonResult<'b, ErrorType>> = 

    let pipeName = "$$$commanderPipe$$$"

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
        writer.WriteLine("Hello from the parent process!")
        // Receive response from the elevated process
        let response = reader.ReadLine()
        ()

    let tryElevatedOnAccessDenied (e: ErrorType) = 
        if e.status = IOError.AccessDenied then
            runElevated ()
            Error e
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
    // Read data sent by the parent process
    let input = reader.ReadLine()
    // Send a response back to the parent process
    writer.WriteLine("Hello from the elevated process!")
