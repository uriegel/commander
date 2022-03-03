import { app, BrowserWindow, BrowserWindowConstructorOptions } from "electron"

const createWindow = async () => {    
    const bounds: BrowserWindowConstructorOptions = {
        x: 22,
        y: 22,
        width: 600,
        height: 600,
        // TODO
        icon: 'kirk.png',
        //show: false,
        //frame: isLinux,
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: true,
            contextIsolation: false
        }      
    }

    const win = new BrowserWindow(bounds)

    win.once('ready-to-show', () => win.show()) 
    win.loadURL("http://localhost:9865")
}

app.on('ready', createWindow)
