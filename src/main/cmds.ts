import { BrowserWindow } from "electron"

export const onCmd = (request: Request, mainWindow: BrowserWindow|null) => {
    switch (request.url) {
        case "cmd://show_dev_tools/":
            mainWindow?.webContents.openDevTools()
            break
        case "cmd://show_fullscreen/":
            mainWindow?.setFullScreen(!mainWindow?.isFullScreen())
            break
        default:
            console.error(`Unknown cmd: ${request.url}`)
            break
    }
}