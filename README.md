# Commander
A Norton Commander clone based on Electron and React with Typescript

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
* check delete remote with progress:

* Unmount and release external drive

* Open directories in Nautilus

* Windows Remote root has /
* Windows Remote copy progress
* Windows Versions in copy dialog: resolve versions in CopyConflictsDialog, adapt button, no default button when not ready

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

