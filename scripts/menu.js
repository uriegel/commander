//import { setHiddenCallback } from "./index.js"
const electron = window.require('electron')

window.onRename = () => {
    alert("Rename")
}

window.onExtendedRename = () => {
    alert("Extended Rename")
}

window.onCopy = () => {
    alert("Copy Files")
}

window.onMove = () => {
    console.log("Move Files")
}

window.onClose = () => close()

window.onHidden = isChecked => {
    console.log(`Show hidden ${isChecked}`)
}

window.setHidden = mi => {} //setHiddenCallback(isChecked => mi.isChecked = isChecked)

window.onFullscreen = () => electron.ipcRenderer.send("fullscreen")

window.onDevTools = () => electron.ipcRenderer.send("openDevTools")