module Theme
open System.Diagnostics
open System.Reactive.Subjects
open System.Threading

open FSharpTools
open Requests

let getTheme () =   
    let mutable output = ""
    try 
        use proc = new Process() 
        proc.StartInfo <- ProcessStartInfo()
        proc.StartInfo.RedirectStandardOutput <- true
        proc.StartInfo.RedirectStandardError <- true
        proc.StartInfo.FileName <- "gsettings"
        proc.StartInfo.CreateNoWindow <- true
        proc.StartInfo.Arguments <- "get org.gnome.desktop.interface gtk-theme"
        proc.EnableRaisingEvents <- true
        proc.OutputDataReceived.Add(fun data -> if data.Data <> null then output <- data.Data)
        proc.ErrorDataReceived.Add(fun data -> eprintfn "%s" data.Data)
        proc.Start() |> ignore
        proc.BeginOutputReadLine();
        proc.BeginErrorReadLine();
        proc.EnableRaisingEvents <- true
        proc.WaitForExit ()
    with
        | _ as e -> eprintfn "%s" <| e.ToString ()

    if output |> String.contains "-dark" then "adwaitaDark" else "adwaita"
()

let startThemeDetection () = 
    
    let onThemeChanged theme = 
        let theme = if theme |> String.contains "-dark" then "adwaitaDark" else "adwaita"
        rendererReplaySubject.OnNext (ThemeChanged theme)
    async {
        try 
            use proc = new Process() 
            proc.StartInfo <- ProcessStartInfo()
            proc.StartInfo.RedirectStandardOutput <- true
            proc.StartInfo.RedirectStandardError <- true
            proc.StartInfo.FileName <- "gsettings"
            proc.StartInfo.CreateNoWindow <- true
            proc.StartInfo.Arguments <- "monitor org.gnome.desktop.interface gtk-theme"
            proc.EnableRaisingEvents <- true
            proc.OutputDataReceived.Add(fun data -> onThemeChanged data.Data)
            proc.ErrorDataReceived.Add(fun data -> eprintfn "%s" data.Data)
            proc.Start() |> ignore
            proc.BeginOutputReadLine();
            proc.BeginErrorReadLine();
            proc.EnableRaisingEvents <- true
            do! proc.WaitForExitAsync CancellationToken.None |> Async.AwaitTask
        with
            | _ as e -> eprintfn "%s" <| e.ToString ()
    } |> Async.Start

