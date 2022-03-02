module Electron

open System
open System.Threading

open FSharpTools

let start args = 
        async {
            try 
                let proc = new Diagnostics.Process() 
                proc.StartInfo <- Diagnostics.ProcessStartInfo()
                proc.StartInfo.RedirectStandardOutput <- true
                proc.StartInfo.RedirectStandardError <- true
                proc.StartInfo.FileName <- "electron"
                proc.StartInfo.Arguments <- args
                proc.EnableRaisingEvents <- true
                proc.OutputDataReceived.Add(fun data -> printfn "%s" data.Data)
                proc.ErrorDataReceived.Add(fun data -> eprintfn "%s" data.Data)
                proc.Start() |> ignore
                proc.BeginOutputReadLine();
                proc.BeginErrorReadLine();
                proc.EnableRaisingEvents <- true
                do! proc.WaitForExitAsync CancellationToken.None |> Async.AwaitTask
            with
                | _ as e -> eprintfn "%s" <| e.ToString ()
        }