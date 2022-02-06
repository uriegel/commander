import { Commander } from "./commander"
const electron = window.require('electron')

export function initialize(commanderToSet: Commander) { commander = commanderToSet }

window.onFullscreen = () => electron.ipcRenderer.send("fullscreen")
window.onDevTools = () => electron.ipcRenderer.send("openDevTools")














var commander: Commander | null = null
console.log("Commander set", commander)





