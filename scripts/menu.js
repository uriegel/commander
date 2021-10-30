const electron = window.require('electron')

export function initializeMenu(commanderToSet) { commander = commanderToSet }

window.onRename = () => {
    console.log("Rename")
}

window.onExtendedRename = () => {
    console.log("Extended Rename")
}

window.onCopy = () => {
    alert("Copy Files")
}

window.onMove = () => {
    console.log("Move Files")
}

window.onClose = () => close()
window.onSelectAll = () => commander.selectAll()
window.onSelectNone = () => commander.selectNone()
window.onHidden = isChecked => commander.showHidden(isChecked)
window.onAdaptPath = () => commander.adaptPath()
window.onRefresh = () => commander.refresh()
window.onViewer = isChecked => commander.showViewer(isChecked)
window.onHideMenu = isChecked => commander.hideMenu(isChecked)
window.onFullscreen = () => electron.ipcRenderer.send("fullscreen")
window.onDevTools = () => electron.ipcRenderer.send("openDevTools")

var commander