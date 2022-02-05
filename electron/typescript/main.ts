//import * as path from 'path'
import * as process from "process"
import { app, BrowserWindow, BrowserWindowConstructorOptions } from "electron"
import * as os from 'os'    
import * as settings from 'electron-settings'
const isLinux = process.platform == "linux"
import { createPlatform } from './platforms/platforms'

// if (process.env.NODE_ENV == 'DEV')
//     require('vue-devtools').install()

// TODO Windows: not working for main process
process.env['UV_THREADPOOL_SIZE'] = os.cpus().length.toString()

//const icon = path.join(__dirname, '../web/assets/kirk.png')

const createWindow = async () => {    

    const platform = createPlatform()
    platform.registerGetIconProtocol()

    const bounds: BrowserWindowConstructorOptions = {
        x: settings.getSync("x") as number,
        y: settings.getSync("y") as number,
        width: settings.getSync("width") as number || 600,
        height: settings.getSync("height") as number || 800,
        icon: 'web/assets/kirk.png',
        show: false,
        frame: isLinux,
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: true,
            contextIsolation: false
        }      
    } 
    
    const win = new BrowserWindow(bounds)
    win.removeMenu()
    if (settings.getSync("isMaximized"))
        win.maximize()

    win.once('ready-to-show', () => win.show()) 
    
    win.on("focus", () => win.webContents.send("focus"))
    win.on("blur", () => win.webContents.send("blur"))

    win.on('maximize', () => {
        const bounds = win.getBounds()
        settings.set("x", bounds.x)
        settings.set("y", bounds.y)
        settings.set("width", bounds.width)
        settings.set("height", bounds.height)
        settings.set("isMaximized", true)
    })

    win.on('unmaximize', () => settings.set("isMaximized", false))    

    win.on("close", () => {
        if (!win.isMaximized()) {
            const bounds = win.getBounds()
            settings.setSync("x", bounds.x)
            settings.setSync("y", bounds.y)
            settings.setSync("width", bounds.width)
            settings.setSync("height", bounds.height)
        }
    })   

    win.loadFile('web/index.html')
}

app.on('ready', createWindow)

// TODO "web-pie-progress": "^0.0.1",
// TODO "web-menu-bar": "^0.3.0",
// TODO "web-electron-titlebar": "^0.2.0",
// TODO eliminate main.js electron
// TODO typescript renderer