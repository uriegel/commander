import { Commander } from "./commander"
const electron = window.require('electron')

export function initialize(commanderToSet: Commander) { commander = commanderToSet }

window.onClose = () => close()
window.onViewer = isChecked => commander.showViewer(isChecked)
window.onFullscreen = () => electron.ipcRenderer.send("fullscreen")
window.onDevTools = () => electron.ipcRenderer.send("openDevTools")

var commander: Commander