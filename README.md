# Commander
A Norton Commander clone based on Electron and React with Typescript

## Prerequisites

```
sudo apt update
sudo apt install pkg-config
sudo apt install build-essential
sudo apt install libgtk-3-dev
```

## Show react devtools
* add ```<script src="http://localhost:8097"></script>``` before ```<script type="module" src="/main.tsx"></script>``` in index.html
* run npm script 'react dev tools'

TODO
* delete (remote) with progress

* Linux: KDE gpx icon not implemented

* Windows Remote root has /
* Windows Remote copy progress
* Windows Versions in copy dialog: resolve versions in CopyConflictsDialog, adapt button, no default button when not ready
* Switch to dark mode and vice versa: adapt windows color

* Windows Services (perhaps elevatable sub process)

* Theming: adapt gray color from KDE/Gtk3 (/Neon/Ubuntu/Fedora)
* Theming: Unify Titlebar, path input and table columns, margins like Gtk4/Adwaita
* Theming: SVG folder Icons per Theme
* Theming: <tr> with padding 

* F11 Full screen Windows: hide titlebar

* menubar-react: Insert shortcut Ins and Einfg

* set info, reset info when mount, getfiles
* set info with short delay and transitions

* CSP in index.html

* alt + enter (KDE with QT program)

// Drag n Drop:
Commander Branch Neon-Rust folder.ts

