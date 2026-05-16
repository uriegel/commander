# Commander
A Norton Commander clone based on C# and React with Typescript

## Prerequisites

### Ubuntu:
```
sudo apt update
sudo apt install pkg-config
sudo apt install libgtk-3-dev
(sudo apt install build-essential)
```

### Fedora:

``` 
sudo dnf install gcc-c++ gtk3-devel
``` 

## Show react devtools
* add ```<script src="http://localhost:8097"></script>``` before ```<script type="module" src="/main.tsx"></script>``` in index.html
* run npm script 'react dev tools'

TODO
* DirectoryWatcher: get extended infos (create, rename?, change?) => Observable debounceTime: 
    per fileItem create Observablewith debouncer, when event is retrieved: destroy observable and start resolving
* Don't refresh after file operations like copy, remove...
* Windows: compare version infos, use already retrieved versions
* Windows: rename as copy

* Open txt file in Linux, close => multiline error in status line, then erweiterte Informationen werden abgerufen......... Copy not possible

* strict mode: sometimes Exceptions Object disposed
* strict mode: rename: wrong position when renamed was selected
* Dispose Directory object when getRoot/getRemote...  AND get Favorites/getRemotesin javascript, change value set idx from dictionary in CS
* Error handling, especially Windows, check if network path, then UAC
* Error handling GFileError
* Error handling  for copying

* Windows remotes

* Windows: compare version infos in sub folders, retrieve version from viewer

* Copy file from folderView to the same folderView: prevent drop

* css as react module

* WebServer deflate
* WebServer if-modified-since for icons

* Windows Mark removable drive type "REMOVABLE"

* Unmount and release external drive

* Open directories in Nautilus

* Windows Remote root has /
* Windows Remote copy progress

* Windows Services (perhaps elevatable sub process)

* Theming: Statusbar lightblue instead of red!
* Theming: Dialog blue color (buttons)
* Theming: select edit blue color
* Theming: adapt gray color from KDE/Gtk3 (/Neon/Ubuntu/Fedora)
* Theming: Unify Titlebar, path input and table columns, margins like Gtk4/Adwaita
* Theming: <tr> with padding 

* Show directory info in preview

* F11 Full screen Windows: hide titlebar

* menubar-react: Insert shortcut Ins and Einfg

* set info, reset info when mount, getfiles
* set info with short delay and transitions

* CSP in index.html

// Drag n Drop:
Commander Branch Neon-Rust folder.ts

