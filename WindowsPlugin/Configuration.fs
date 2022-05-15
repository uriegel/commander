module Configuration

type Platform =
    | Kde     = 0
    | Gnome   = 1
    | Windows = 2

let getPlatform () = Platform.Windows

let appicon = "web/images/appicon"

