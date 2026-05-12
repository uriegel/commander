# Commander
A Norton Commander clone based on C# and React with Typescript

## Prerequisites

### Ubuntu:
```
sudo apt update
sudo apt install pkg-config
sudo apt install build-essential
sudo apt install libgtk-3-dev
```

### Fedora:

``` 
sudo dnf install gcc-c++ gtk3-devel
``` 

## Show react devtools
* add ```<script src="http://localhost:8097"></script>``` before ```<script type="module" src="/main.tsx"></script>``` in index.html
* run npm script 'react dev tools'

TODO
* Windows: compare version infos
* Windows: rename as copy
* DirectoryWatcher: On initiaslize save files count, create dictionary idx
* DirectoryWatcher: Create: idx = count++, call get extendedInfos to javascript: item sort in javascript, 
* DirectoryWatcher: Delete: delete item in in javascript
* DirectoryWatcher: Change: find item in javascript, change value set idx from dictionary in CS
* Error handling, especially Windows, check if network path, then UAC
* Error handling GFileError
* Error handling  for copying

* Windows remotes

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

