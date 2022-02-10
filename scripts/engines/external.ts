import { ItemResult } from "./engines"
import { FileEngine, FileItem } from "./file"
const http = window.require('http')

export const EXTERNAL_PATH = "external/"

type RequestData = GetFilesInput

type GetFilesInput = {
    path: string
}

type Response = File[]

type File = {
    name: string, 
    isDirectory: boolean
    size: number
    isHidden: boolean, 
    time: number
}

export class ExternalEngine extends FileEngine {

    constructor(folderId: string, path: string) {
        super(`${folderId}-external`)

        this.ip = path.substring(8, path.indexOf('/', 9)) 
        this.rootPath = `external/${this.ip}/`
        this.pathBegin = this.rootPath.length - 1
    }

    override async getItems(path: string|null = "", showHiddenItems?: boolean) {
        var response = (await this.getFiles(path!.substring(this.pathBegin)))
            .filter(n => showHiddenItems ? true : !n.isHidden) as FileItem[]

        let items = [{
                name: "..",
                isDirectory: true,
                isHidden: false,
                size: 0,
                time: 0,
                isNotSelectable: true
            } as FileItem ] 
            .concat(response.filter(n => n.isDirectory))
            .concat(response.filter(n => !n.isDirectory))
        if (items && items.length)
            this.currentPath = path!
        return { items, path } as ItemResult
    }

    private async getFiles(path: string): Promise<File[]> {
        return this.request("getfiles", { path })
    }

    private async request(path: string, data: RequestData): Promise<Response> {
        const keepAliveAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 40000
        })

        return new Promise((resolve, reject) => {
            var payload = JSON.stringify(data)
            let responseData = ''
            const req = http.request({
                hostname: this.ip,
                port: 8080,
                path,
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

    private ip: string
    private rootPath: string
    private pathBegin

}