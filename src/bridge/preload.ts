// eslint-disable-next-line 
const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onMessage: (callback: (msg: unknown) => void) => ipcRenderer.on('fromMain', (_: unknown, data: unknown) => callback(data)),
})

contextBridge.exposeInMainWorld('env', {
    platform: process.platform,
    getDropPath: (file: File) => webUtils.getPathForFile(file)
})