# Commander
A Norton Commander clone based on Electron (globally insdtalled), F#, Typescript and Web Components

## Setup
`npm i -g electron`

## on Linux
`sudo apt install libgtk-3-dev`
`sudo apt install trash-cli`

Asp.NET is using FileSystemWatcher, in Debugger you have to increase

`echo fs.inotify.max_user_instances=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`