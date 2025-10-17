// eslint-disable-next-line 
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onMessage: (callback: (msg: unknown) => void) => ipcRenderer.on('fromMain', (_: unknown, data: unknown) => callback(data)),
})

contextBridge.exposeInMainWorld('env', {
    platform: process.platform
})