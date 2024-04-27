# Commander
A Norton Commander clone based on Electron (globally installed), C# and React

## Setup
```
sudo apt install libadwaita-1-dev
sudo apt install libgtk-4-dev
npm i
```

## Debug

Start npm script `start react-scripts start`

Press F5 (`Debug` oder `Debug Windows`)

```npm install -g react-devtools```

Start devtools:

```react-devtools```

## Build

Start npm script `build` or `build Windows`
 
Press `StartCtrl+Shift+B` and run `buildRelease`. `Commander/bin/Release/net6.0/linux-x64/publish/Commander` is a single file executable containing all but `electron` and `.NET runtime 6.0`.

## Run as admin
on Linux type
```
sudo -E ./commander
```

on Windows start with elevated rights
## Legacy

### on Linux
`
`sudo apt install gtk3-devel` (Fedora Gnome)

`sudo apt install trash-cli`

Asp.NET is using FileSystemWatcher, in Debugger you have to increase

`echo fs.inotify.max_user_instances=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`

## Build

run npm scripts `tsc` and `build`

`dotnet publish -c Release`

either with .NET included or not: `SelfContained` = true or false in `commander.fsproj`

## Install as launcher on Linux:

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
```

```gsettings get org.gnome.shell favorite-apps```