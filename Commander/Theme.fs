module Theme

open FSharpTools
open System.Diagnostics

open CommanderCore
open System.Threading

#if Windows
open Microsoft.Win32
open System
open System.Runtime.InteropServices
#endif

#if Linux

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

let startThemeDetection onChanged = 
    let startKdeThemeDetection () = 
        ()

    let startGnomeThemeDetection () = 
        
        let onThemeChanged theme = 
            let theme = if theme |> String.contains "-dark" then "adwaitaDark" else "adwaita"
            onChanged theme
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

#endif

#if Windows

[<DllImport("Advapi32.dll", SetLastError = true)>]
extern int RegNotifyChangeKeyValue(IntPtr hKey, bool watchSubtree, int32 types, IntPtr hEvent, bool asynchronous)

let getThemeFromKey (key: RegistryKey) = 
    let value = key.GetValue "SystemUsesLightTheme"
    if value = null || value = 1 then
        "windows"
    else
        "windowsDark"   

let key = Registry.CurrentUser.OpenSubKey "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize"

let getTheme () = getThemeFromKey key

let startThemeDetection onChanged = 
    async {
        let rec waitForChanges currentTheme =
            let status = RegNotifyChangeKeyValue (key.Handle.DangerousGetHandle (), false, 4, IntPtr.Zero, false)
            if status <> 0 then
                ()
            else
                let theme = getTheme ()
                if currentTheme <> theme then
                    onChanged theme
                waitForChanges theme
        waitForChanges <| getTheme ()
    } |> Async.Start

#endif