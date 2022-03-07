module Theme

open Microsoft.Win32
open System
open System.Runtime.InteropServices

open Requests

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

let startThemeDetection () = 
    async {
        let rec waitForChanges currentTheme =
            let status = RegNotifyChangeKeyValue (key.Handle.DangerousGetHandle (), false, 4, IntPtr.Zero, false)
            if status <> 0 then
                ()
            else
                let theme = getTheme ()
                if currentTheme <> theme then
                    rendererReplaySubject.OnNext (ThemeChanged theme)
                waitForChanges theme
        waitForChanges <| getTheme ()
    } |> Async.Start
