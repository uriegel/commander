var server = HttpServer.New();
Theme.StartChangeDetecting();
server.Start();
WebView.Instance.Run();
server.Stop();

// TODO Windows version
// TODO Variance in WebView
// TODO Quit when copying (Linux/Windows)
// TODO previewMode.OnNotify("selected", FocusAfter1<bool>(
// TODO	settings.SignalConnect("changed::gtk-theme", Changed); internal
// TODO Copy cancellation

// TODO GetFiles has to return mount info => save mount info as lastPath
// TODO Favorites with display names and mount info
// TODO Unmount and Eject removable devices in root view 
// TODO F3 when root: show Drive properties
// TODO F3 when directory: show Directory properties

// TODO result.dirCount, result.fileCount when copied, deleted

// TODO ProgressControl dialog: progressbar color gray when finished

// TODO strict mode: sometimes Exceptions Object disposed
// TODO strict mode: rename: wrong position when renamed was selected
// TODO Dispose Directory object when getRoot/getRemote...  AND get Favorites/getRemotesin javascript, change value set idx from dictionary in CS
// TODO Error handling GFileError
// TODO Error handling  for copying

// TODO clean Commander/Resources/assets

// TODO Windows remotes

// TODO Windows: compare version infos in sub folders, retrieve version from viewer

// TODO Copy file from folderView to the same folderView: prevent drop

// TODO css as react module

// TODO WebServer if-modified-since for icons

// TODO Windows Mark removable drive type "REMOVABLE"

// TODO Unmount and release external drive

// TODO Open directories in Nautilus

// TODO Windows Remote root has /
// TODO Windows Remote copy progress

// TODO Windows Services (perhaps elevatable sub process)

// TODO Theming: adapt gray color from KDE/Gtk3 (/Neon/Ubuntu/Fedora)
// TODO Theming: Unify Titlebar, path input and table columns, margins like Gtk4/Adwaita
// TODO Theming: <tr> with padding 

// TODO Show directory info in preview

// TODO F11 Full screen Windows: hide titlebar

// TODO menubar-react: Insert shortcut Ins and Einfg

// TODO set info, reset info when mount, getfiles
// TODO set info with short delay and transitions

// TODO CSP in index.html

 

