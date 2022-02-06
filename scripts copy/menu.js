const electron = window.require('electron')
import { hideMenu } from "./platforms/switcher.js"

export function initializeMenu(commanderToSet) { commander = commanderToSet }

window.onRename = () => commander.rename()

window.onExtendedRename = () => {
    commander.extendedRename()
}

window.onCopy = () => commander.copy()
window.onMove = () => commander.copy(true)
window.onCreateFolder = () => commander.createFolder()
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