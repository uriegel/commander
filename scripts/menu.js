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

window.onHidden = mi => {
    if (window.onShowHiddenCallback)
        window.onShowHiddenCallback(mi.isChecked)
}

window.onViewer = mi => {
    if (window.onShowViewerCallback)
        window.onShowViewerCallback(mi.isChecked)
}

window.onFullscreen = () => electron.ipcRenderer.send("fullscreen")

window.onDevTools = () => electron.ipcRenderer.send("openDevTools")

