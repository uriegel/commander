# Commander
A Norton Commander clone based on Electron (globally installed), F#, Typescript and Web Components

## Setup
`sudo npm i -g electron`

`npm i`

## Debug

Start npm script `start react-scripts start`

Press F5 (`Debug` oder `Debug Windows`)

## Legacy

### on Linux
`sudo apt install libgtk-3-dev` (Gnome)

`sudo apt install gtk3-devel` (Fedora Gnome)

`sudo apt install trash-cli`

Asp.NET is using FileSystemWatcher, in Debugger you have to increase

`echo fs.inotify.max_user_instances=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`

## Build

run npm scripts `tsc` and `build`

`dotnet publish -c Release`

either with .NET included or not: `SelfContained` = true or false in `commander.fsproj`

## Install as launcher on Linux:

`sudo desktop-file-install commander.desktop`