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
* DirectoryWatcher: rename events, change index in dictionaries in C#
* DirectoryWatcher: rename events, 2nd rename
* DirectoryWatcher: edit file in editor, save
* DirectoryWatcher: change events only for ItemsProvider FILE
* DirectoryWatcher: consider hidden
* DirectoryWatcher: hidden: no created, no change, but renamed with oldFIle=-1
* DirectoryWatcher: not hidden: created with index update, change wth index, renamed with oldFile=index
* DirectoryWatcher: Rename: find item in dictionary, get key,  find item, find old item, replace old with new
* DirectoryWatcher: Create: idx = idxSeed++, add in dictionary, call get extendedInfos to javascript: item sort in javascript, 
* DirectoryWatcher: Change: Debounce! find item in dictionary, get key,  find item 
* DirectoryWatcher: Delete: delete from dictionary delete item in in javascript
* DirectoryWatcher: rename events position on renamed in strict mode
* strict mode: sometimes Exceptions Object disposed
* Dispose Directory object when getRoot/getRemote...  AND get Favorites/getRemotesin javascript, change value set idx from dictionary in CS
* Windows: compare version infos
* Windows: rename as copy
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

