import { app, BrowserWindow, BrowserWindowConstructorOptions } from "electron"
import http from "http"

type Methods = "sendbounds"
type Bounds = {
    x: number | undefined
    y: number | undefined
    width: number
    height: number
    isMaximized?: boolean
}
type InputData = Bounds

let bounds: BrowserWindowConstructorOptions = JSON.parse(process.env['Bounds']!)

const createWindow = async () => {    
    bounds.webPreferences = {
        nodeIntegration: true,
        allowRunningInsecureContent: true,
        contextIsolation: false
    }      
    bounds.show = false
    //bounds.frame: isLinux,

    const win = new BrowserWindow(bounds)
    if ((bounds as Bounds).isMaximized)
        win.maximize()

    win.once('ready-to-show', () => win.show()) 

    win.on('maximize', async () => {
        const bounds: Bounds = win.getBounds()
        bounds.isMaximized = true
        await request("sendbounds", bounds)
    })

    let doClose = false
    win.on("close", async (evt: Event) => {
        if (!doClose &&!win.isMaximized()) {
            evt.preventDefault()
            const bounds: Bounds = win.getBounds()
            await request("sendbounds", bounds)
            doClose = true
            win.close()
        }
    })   
    
    win.loadURL("http://localhost:9865")

    async function request(method: Methods, inputData: InputData): Promise<Response> {
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
                    const result = JSON.parse(responseData)
                    resolve(result)
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
