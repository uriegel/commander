const { app, BrowserWindow, ipcMain } = require('electron')
const settings = require('electron-settings')

// if (process.env.NODE_ENV == 'DEV')
//     require('vue-devtools').install()

const createWindow = () => {    
    const bounds = { 
        x: settings.getSync("x"),
        y: settings.getSync("y"),
        width: settings.getSync("width") || 600,
        height: settings.getSync("height") || 600,
        show: false,
        frame: false,
        icon: 'web/assets/kirk.png',
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: true,
            contextIsolation: false
        }      
    } 
    
    win = new BrowserWindow(bounds)   
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
    
    win.once('ready-to-show', () => { 
        win.show() 
    }) 

    win.on("focus", () => win.webContents.send("focus"))
    win.on("blur", () => win.webContents.send("blur"))

    win.loadFile('web/index.html')

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
}

app.removeAllListeners('ready')
app.on('ready', createWindow)

app.on("activate", () => {
    if (win === null) 
        createWindow()
})

var win