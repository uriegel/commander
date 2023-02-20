import { app, BrowserWindow, BrowserWindowConstructorOptions } from "electron"
import { nativeImage } from "electron/common"
import http from "http"

const isDebug = process.argv[2] == "-debug"

type Events = {
    Case: "ShowDevTools" | "ShowFullscreen" | "Maximize" | "Minimize" | "Restore" | "Close" | "StartDrag"
    Fields: string[][]
}

type Methods = "sendbounds" | "getevents" | "electronmaximize" | "electronunmaximize" | "fullscreen" | "fullscreenoff" 
type Bounds = {
    x:            number | undefined
    y:            number | undefined
    width:        number
    height:       number
    isMaximized?: boolean
    theme?:       string
    frame?:       boolean
}
type Empty = {}
type InputData = Bounds | Empty

let bounds: BrowserWindowConstructorOptions = JSON.parse(process.env['Bounds']!)
let isWindows = process.env['Platform'] == "Windows"
console.log("isWindows", isWindows)

const createWindow = async () => {  
    bounds.show = false

    bounds.frame = true
        
    const win = new BrowserWindow(bounds)
    win.setBackgroundColor((bounds as Bounds).theme?.endsWith("Dark") ? "black" : "white")
    if ((bounds as Bounds).isMaximized)
        win.maximize()
    win.removeMenu()

    win.once('ready-to-show', win.show)
    win.on('maximize', async () => {
        const bounds: Bounds = win.getBounds()
        bounds.isMaximized = true
        await request("sendbounds", bounds)
        await request("electronmaximize", {})
    })
    win.on('unmaximize', async () => {
        await request("electronunmaximize", {})
    })

    let doClose = false
    win.on("close", async (evt: Event) => {
        if (!doClose &&!win.isMaximized()) {
            evt.preventDefault()
            doClose = true
            const bounds: Bounds = win.getBounds()
            try {
                await request("sendbounds", bounds, 5000)
                console.log("close after")
            } catch {
                console.log("close after fehler")
            }
            win.close()
        }
    })   

    win.loadURL(isDebug
        ? `http://localhost:3000?theme=${(bounds as Bounds).theme}&platform=${isWindows ? "windows" : "linux"}`
        : `http://localhost:20000?theme=${(bounds as Bounds).theme}&frame=${(bounds as Bounds).frame}`)

    async function getEvents() {
        await request("getevents", {})
        getEvents()    
    }
    getEvents()

    async function request(method: Methods, inputData: InputData, timeout = 40000): Promise<void> {
        const keepAliveAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: timeout
        })

        return new Promise((resolve, reject) => {
            var payload = JSON.stringify(inputData)
            let responseData = ''
            const req = http.request({
                hostname: "localhost",
                port: 20000,
                path: `/commander/${method}`,
                agent: keepAliveAgent,
                timeout,
                method: 'POST',
                headers: {
					'Content-Type': 'application/json; charset=UTF-8',
					'Content-Length': Buffer.byteLength(payload)
				}            
            }, (response: any) => {
                response.setEncoding('utf8')
                response.on('data', (chunk: any) => responseData += chunk)
                response.on('end', async () => {
                    const evt = JSON.parse(responseData) as Events
                    switch (evt.Case) {
                        case "ShowDevTools":
                            win.webContents.openDevTools()
                            break
                        case "ShowFullscreen":
                            win.setFullScreen(!win.isFullScreen())
                            if (win.isFullScreen())
                                request("fullscreen", {})
                            else
                                request("fullscreenoff", {})
                            break
                        case "Maximize":
                            win.maximize()
                            break
                        case "Minimize":
                            win.minimize()
                            break
                        case "Restore":
                            win.unmaximize()
                            break
                        case "Close":
                            win.close()
                            break
                        case "StartDrag":
                            console.log("startDrag", evt.Fields[0])
                            win.webContents.startDrag({ 
                                files: evt.Fields[0], 
                                file: "", 
                                icon: nativeImage.createFromBuffer(await requestBuffer("geticon?path=.exe"))
                            })
                            break
                    }
                    resolve()
                })
            })        
            
            req.on('error', (e: any) => {
                reject(e)
            })
            req.write(payload)
            req.end()        
        }) 
    }    

    async function requestBuffer(method: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            let chunks: any[] = []
            const req = http.request({
                hostname: "localhost",
                port: 20000,
                path: `/commander/${method}`,
                timeout: 40000,
                method: 'GET'
            }, (response: any) => {
                response.setEncoding('binary');
                response.on('data', (chunk: any) => chunks.push(Buffer.from(chunk, 'binary')))
                response.on('end', () => {
                    resolve(Buffer.concat(chunks))
                })
            })        
            
            req.on('error', (e: any) => {
                reject(e)
            })
            req.end()        
        }) 
    }    
}

app.on('ready', createWindow)
