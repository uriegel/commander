module PlatformDirectory

let init = 
    printfn "Komm rein !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    GtkDotNet.Raw.Gtk.Init()
    let init () = ()
    init

let getIcon ext = 
    init ()
    let info = GtkDotNet.IconInfo.Choose(ext, 16, GtkDotNet.IconLookup.NoSvg)
    info.GetFileName() 
