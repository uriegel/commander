module WindowBounds

open CommanderCore
open Configuration
open FileSystem
open System
open System.Text.Json

let saveBounds (bounds: WindowBounds) = 
    use stream = securedCreateStream <| getElectronFile "bounds.json"
    JsonSerializer.Serialize (stream, bounds, getJsonOptions ())

#if Linux
let appicon = "web/images/kirk.png"
#endif

#if Windows
let appicon = "web/images/appicon"    
#endif

let getBounds theme = 
    let filename = getElectronFile "bounds.json"
    if IO.File.Exists filename then
        use stream = securedOpenStream <| getElectronFile "bounds.json"
        { 
            JsonSerializer.Deserialize<WindowBounds> (stream, getJsonOptions ())     
                with 
                    Icon  = Some <| saveResource (getElectronFile "appicon.ico", appicon)
                    Theme = Some theme
                    Frame = Some (getPlatform () <> Platform.Windows)
        }
    else {
            X           = None
            Y           = None
            Width       = 600
            Height      = 800
            IsMaximized = Some false
            Icon        = Some <| saveResource (getElectronFile "appicon.ico", appicon)
            Theme       = Some theme
            Frame       = Some (getPlatform () <> Platform.Windows)
        }
        