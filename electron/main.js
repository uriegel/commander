const { app, BrowserWindow, ipcMain } = require('electron')

// if (process.env.NODE_ENV == 'DEV')
//     require('vue-devtools').install()

const createWindow = () => {    
    const bounds = { 
        width: 600,
        height: 800,
        show: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: true,
            contextIsolation: false
        }      
    } 
    
    win = new BrowserWindow(bounds)   

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

    // win.on('maximize', () => {
    //     const bounds = win.getBounds()
    //     settings.set("window-bounds", bounds as any)
    //     settings.set("isMaximized", true)
    // })

    // win.on('unmaximize', () => {
    //     settings.set("isMaximized", false)
    // })    

    // win.on("closed", () => win = null)    
}

app.removeAllListeners('ready')
app.on('ready', createWindow)

app.on("activate", () => {
    if (win === null) 
        createWindow()
})

var win
