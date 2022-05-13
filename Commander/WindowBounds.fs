module WindowBounds

open Configuration
open FileSystem
open System
open System.Text.Json
open System.Text.Json.Serialization

let saveBounds (bounds: WindowBounds) = 
    use stream = securedCreateStream <| getElectronFile "bounds.json"
    JsonSerializer.Serialize (stream, bounds, getJsonOptions ())

open PlatformConfiguration

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
        