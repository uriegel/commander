open Configuration
open Theme

Server.start ()

test ()

async {
    do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
} |> Async.RunSynchronously

// TODO Replace long polling to electron with stdin pipe

// TODO automatic theme controlling Linux 
// [uwe@illmatic ~]$ gsettings monitor org.gnome.desktop.interface gtk-theme
//  gtk-theme: 'Adwaita-dark'
//  gtk-theme: 'Adwaita'
// ^C
// [uwe@illmatic ~]$ gsettings get org.gnome.desktop.interface gtk-theme
// 'Adwaita'
// [uwe@illmatic ~]$ 

// TODO automatic theme controlling Windows 
// https://docs.microsoft.com/en-us/previous-versions/windows/desktop/regprov/registryvaluechangeevent