const { app, BrowserWindow, ipcMain, protocol } = require('electron')
const process = require("process")
const path = require("path")
const settings = require('electron-settings')
const { getIcon } = require('filesystem-utilities')
const { registerRunCmd } = require('./commands')

// if (process.env.NODE_ENV == 'DEV')
//     require('vue-devtools').install()

const isLinux = process.platform == "linux"
const icon = path.join(__dirname, '../web/assets/kirk.png')

const createWindow = async () => {    

    const initGtk = async () => await getIcon(".js")
    await initGtk()

    protocol.registerBufferProtocol('icon', async (request, callback) => {
        const url = request.url
        var ext = url.substring(7)
        var icon = await getIcon(ext)
        callback({ mimeType: 'img/png', data: icon })
    }, (error) => {
        if (error) console.error('Failed to register protocol', error)
    })

    protocol.registerFileProtocol('view', async (request, callback) => {
        const url = request.url
        var path = decodeURI(url.substring(7))
        callback(path)
    })

    registerRunCmd()        

    const bounds = {
        x: settings.getSync("x"),
        y: settings.getSync("y"),
        width: settings.getSync("width") || 600,
        height: settings.getSync("height") || 800,
        show: false,
        frame: isLinux,
        icon: 'web/assets/kirk.png',
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: true,
            contextIsolation: false
        }      
    } 
    
    win = new BrowserWindow(bounds)
    win.removeMenu()
    if (settings.getSync("isMaximized"))
        win.maximize()

    ipcMain.on("openDevTools",  () => win.webContents.openDevTools())
    ipcMain.on("fullscreen",  () => win.setFullScreen(!win.isFullScreen()))
    ipcMain.on("minimize",  () => win.minimize())
    ipcMain.on("maximize",  () => {
        if (win.isMaximized())
            win.restore()
        else
            win.maximize()  
    })

    ipcMain.on("dragStart", (evt, files) => { 
        win.webContents.startDrag({ files, icon })
    })
    
    win.once('ready-to-show', () => { 
        win.show() 
    }) 

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
    win.on("closed", () => win = null)
    
    win.loadFile('web/index.html')
}

app.removeAllListeners('ready')
app.on('ready', createWindow)

var win