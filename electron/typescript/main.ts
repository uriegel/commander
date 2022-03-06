import { app, BrowserWindow, BrowserWindowConstructorOptions } from "electron"
import http from "http"
import readline from 'readline'

enum EventMethod {
    NoEvent = 0,
    ShowDevTools = 1,
    ShowFullscreen = 2
} 

type Events = {
    method: EventMethod
}

type Methods = "sendbounds" | "getevents"
type Bounds = {
    x: number | undefined
    y: number | undefined
    width: number
    height: number
    isMaximized?: boolean
}
type Empty = {}
type InputData = Bounds | Empty

let bounds: BrowserWindowConstructorOptions = JSON.parse(process.env['Bounds']!)

const createWindow = async () => {  
    bounds.show = false
    bounds.frame = true

    const win = new BrowserWindow(bounds)
    if ((bounds as Bounds).isMaximized)
        win.maximize()
    win.removeMenu()

    win.once('ready-to-show', win.show)
    win.on('maximize', async () => {
        const bounds: Bounds = win.getBounds()
        bounds.isMaximized = true
        await request("sendbounds", bounds)
    })

    let doClose = false
    win.on("close", async (evt: Event) => {
        if (!doClose &&!win.isMaximized()) {
            evt.preventDefault()
            doClose = true
            const bounds: Bounds = win.getBounds()
            await request("sendbounds", bounds)
            win.close()
        }
    })   

    win.loadURL("http://localhost:9865")

    async function getEvents() {
        await request("getevents", {})
        getEvents()    
    }
    getEvents()

    const rl = readline.createInterface({
        input: process.stdin,
        terminal: false
    })

    rl.on('line', line => console.log("Linie", line))

    async function request(method: Methods, inputData: InputData): Promise<void> {
        const keepAliveAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 40000
        })

        return new Promise((resolve, reject) => {
            var payload = JSON.stringify(inputData)
            let responseData = ''
            const req = http.request({
                hostname: "localhost",
                port: 9865,
                path: `/commander/${method}`,
                agent: keepAliveAgent,
                timeout: 40000,
                method: 'POST',
                headers: {
					'Content-Type': 'application/json; charset=UTF-8',
					'Content-Length': Buffer.byteLength(payload)
				}            
            }, (response: any) => {
                response.setEncoding('utf8')
                response.on('data', (chunk: any) => responseData += chunk)
                response.on('end', () => {
                    const evt = JSON.parse(responseData) as Events
                    console.log("evt", evt)
                    switch (evt.method) {
                        case EventMethod.ShowDevTools:
                            win.webContents.openDevTools()
                            break
                        case EventMethod.ShowFullscreen:
                            win.setFullScreen(!win.isFullScreen())
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
}

app.on('ready', createWindow)
