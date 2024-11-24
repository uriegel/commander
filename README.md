# Commander
A Norton Commander clone based on rust crate webview_app (Webview2 on Windows, WebkitGtk6 on Linux), rust and React

## Prerequisites on Linux (Fedora)
* ```sudo dnf install gtk4-devel```
* ```sudo dnf install webkitgtk6.0-devel```
* ```sudo dnf install libadwaita-devel```

## Prerequisites on Linux (Ubuntu)
* ```sudo apt install libgtk-4-dev```
* ```sudo apt install libwebkitgtk-6.0-dev```
* ```sudo apt install libadwaita-1-dev```

## Setup

```
cd website
npm install
```

### On Windows

Copy ```resources/kirk.png``` to ```website/public/images/kirk.png``` on Windows

## Debug

Start npm script `build` (Package.json in /website)

Start npm script `dev` (Package.json in /website)

Press F5

```npm install -g react-devtools```

Start devtools:

```react-devtools```

Gtk4 Inspector

```sudo dnf install dconf-editor```

Then open it

```org/gtk/settings/debug/enable-inspector-keybinding```

Then in Commander:

press ```F10``` and then ```Ctrl+Shift+D```

### Build

Start npm script `build` or `build Windows`
 
Press `StartCtrl+Shift+B` and run `buildRelease`. `Commander/bin/Release/net6.0/linux-x64/publish/Commander` is a single file executable containing all but `electron` and `.NET runtime 6.0`.

## Release

start npm script `build` (Package.json in /website)

run 

```
cargo build --release
```

## Run as admin
on Linux type
```
sudo -E ./commander
```

on Windows start with elevated rights

## Hints for Linux

Asp.NET is using FileSystemWatcher, in Debugger you have to increase

`echo fs.inotify.max_user_instances=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`

### Install as launcher on Linux:

Copy commander.desktop (or the contained adapted version) to /usr/share/applications.

```
#!/usr/bin/env xdg-open
[Desktop Entry]
Version=1.0
Type=Application
Terminal=false
Exec=/usr/share/applications/commander
Name=Commander
Comment=File Commander
Icon=/usr/share/applications/commander.png
StartupWMClass=de.uriegel.commander
```

