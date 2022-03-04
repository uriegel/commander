import { app, BrowserWindow, BrowserWindowConstructorOptions } from "electron"
import http from "http"

console.log("Enf", process.env['Bounds']) 

const createWindow = async () => {    
    const bounds: BrowserWindowConstructorOptions = {
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

    async function request(): Promise<Response> {
        const keepAliveAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 40000
        })

        return new Promise((resolve, reject) => {
            var payload = JSON.stringify({
                x: 9,
                y: 12,
                width: 700,
                height: 345,
                isMaximized: false
            })
            let responseData = ''
            const req = http.request({
                hostname: "localhost",
                port: 9865,
                path: "/commander/sendbounds",
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
                console.log("error", "problem with request", e)
                reject(e)
            })
            req.write(payload)
            req.end()        
        }) 
    }    

    async function run() {
        let res = await request()
        await request()
        console.log("Ergebnis", res)
    }
    run()
}

app.on('ready', createWindow)
