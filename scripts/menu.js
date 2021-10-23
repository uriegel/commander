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
    if (window.onShowHiddenCallback)
        window.onShowHiddenCallback(isChecked)
}

window.onViewer = isChecked => {
    if (window.onShowViewerCallback)
        window.onShowViewerCallback(isChecked)
}

window.onFullscreen = () => electron.ipcRenderer.send("fullscreen")

window.onDevTools = () => electron.ipcRenderer.send("openDevTools")

