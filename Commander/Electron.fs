module Electron

open FSharpTools
open System
open System.Threading

let affe = Environment.OSVersion
let isLinux = affe.VersionString |> String.startsWith "Unix" 

let start args = 
        async {
            try 
                use proc = new Diagnostics.Process() 
                proc.StartInfo <- Diagnostics.ProcessStartInfo()
                proc.StartInfo.RedirectStandardOutput <- true
                proc.StartInfo.RedirectStandardError <- true
                proc.StartInfo.FileName <- if isLinux then "electron" else "electron.cmd"
                //proc.StartInfo.Arguments <- args
                proc.StartInfo.Arguments <- "http://localhost:9865/foo"
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