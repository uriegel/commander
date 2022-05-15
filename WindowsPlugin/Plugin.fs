module Plugin

open System
open System.Diagnostics
open System.Net
open System.Net.Http
open System.Reflection
open System.Runtime.InteropServices

[<DllImport("user32.dll", SetLastError = true, CharSet=CharSet.Auto)>]
extern int MessageBox(nativeint wnd, string text, string title, uint typ);

let rec run () =
    Threading.Thread.Sleep 1000
    let httpClient = new HttpClient()
    use requestMessage = new HttpRequestMessage(HttpMethod.Get, Uri("http://localhost:20000/commander/check"))
    use responseMessage = httpClient.Send(requestMessage) 
    match responseMessage.StatusCode with
    | HttpStatusCode.OK -> run ()
    | _ -> ()

let init () = 
    let startAsAdmin () = 
        let exe = Assembly.GetEntryAssembly().Location.Replace(".dll", ".exe")
        let info = new ProcessStartInfo (exe)
        info.Arguments <- "-adminMode"
        info.Verb <- "runas"
        info.UseShellExecute <- true
        let proc = new Process ()
        proc.StartInfo <- info 
        try 
            proc.Start () |> ignore
        with
        | _ -> ()
 
    let args = Environment.GetCommandLineArgs ()
    match args.Length > 1 && args[1] = "-adminMode" with
    | true  -> 
        (20001, false)
    | false -> 
        if MessageBox(IntPtr.Zero, "Möchtest Du auch Aktionen mit Administratorrechten ausführen?\n\nEs erscheinen immer Admin-Abfragen bei Bedarf", "Commander", 0x21u) = 1 then
            startAsAdmin ()
        (20000, true)

