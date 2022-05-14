module Configuration

open System
open System.Diagnostics
open System.Reflection
open System.Runtime.InteropServices
open System.Threading

type Platform =
    | Kde     = 0
    | Gnome   = 1
    | Windows = 2

let getPlatform () = Platform.Windows

let appicon = "web/images/appicon"

let startAsAdmin () = 
    let exe = Assembly.GetEntryAssembly().Location.Replace(".dll", ".exe")
    let info = new ProcessStartInfo (exe)
    info.Arguments <- "-adminMode"
    info.Verb <- "runas"
    info.UseShellExecute <- true
    let proc = new Process ()
    proc.StartInfo <- info 
    try 
        let res = proc.Start () 
        if res = false then
            printfn "falsch"
    with
    | _ -> printfn "falsch ex"

[<DllImport("user32.dll", SetLastError = true, CharSet=CharSet.Auto)>]
extern int MessageBox(nativeint wnd, string text, string title, uint typ);

let init () = 
    let args = Environment.GetCommandLineArgs ()
    match args.Length > 1 && args[1] = "-adminMode" with
    | true  -> 
        (20001, false)
    | false -> 
        if MessageBox(IntPtr.Zero, "Möchtest Du auch Aktionen mit Administratorrechten ausführen?\n(Es erscheinen immer Warnhinweise)", "Commander", 0x21u) = 1 then
            startAsAdmin ()
        (20000, true)

