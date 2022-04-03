module Theme
open FSharpTools
open System.Diagnostics
open System.Reactive.Subjects
open System.Threading

open Configuration
open PlatformConfiguration
open Requests

let getTheme () =   
    let getKdeTheme () =   
        let mutable output = ""
        try 
            use proc = new Process() 
            proc.StartInfo <- ProcessStartInfo()
            proc.StartInfo.RedirectStandardOutput <- true
            proc.StartInfo.RedirectStandardError <- true
            proc.StartInfo.FileName <- "kreadconfig5"
            proc.StartInfo.CreateNoWindow <- true
            proc.StartInfo.Arguments <- "--group \"Icons\" --key \"Theme\""
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

        if output |> String.contains "-dark" then "breezeDark" else "breeze"

    let getGnomeTheme () =   
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

    match getPlatform () with
    | Platform.Kde -> getKdeTheme ()
    | _            -> getGnomeTheme ()

let startThemeDetection () = 
    let startKdeThemeDetection () = 
        ()

    let startGnomeThemeDetection () = 
        
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

    match getPlatform () with
    | Platform.Kde -> startKdeThemeDetection ()
    | _            -> startGnomeThemeDetection ()
