import { FolderItem } from "../components/folder"
import { EngineId, ItemResult, PathResult } from "./engines"
import { EXTERNALS_PATH } from "./externals"
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
        super(EngineId.External, `${folderId}-external`)

        const pos = path.indexOf('/', 10)
        this.ip = pos == -1 ? path.substring(9) : path.substring(9, pos)
        this.rootPath = `external/${this.ip}`
        this.pathBegin = this.rootPath.length
    }

    override isSuitable(path: string|null|undefined) { return path != EXTERNALS_PATH && path?.startsWith(EXTERNAL_PATH) == true }

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

    override async getPath(item: FolderItem, _: ()=>void) {
        return item.isDirectory 
        ? item.name != ".."
            ? { path: this.currentPath + '/' + item.name }
            : this.currentPath == this.rootPath
                ? { path: EXTERNALS_PATH }
                : this.getParentDir(this.currentPath) 
        : { }
    }

    override async renameItem(item: FolderItem, folder: any) { }
    override async deleteItems(items: FolderItem[], folder: any) {}
    override async createFolder(suggestedName: string, folder: any) {}
    override onEnter(name: string) { }
    
    protected override getParentDir(path: string): PathResult {
        let pos = path.lastIndexOf('/')
        let parent = pos ? path.substring(0, pos) : '/'
        return { path: parent, recentFolder: path.substring(pos + 1) }
    }

    protected override async addAdditionalInfo(item: FileItem, name: string, path: string) { }

    protected override getAdditionalSortFunction(column: number, isSubItem: boolean): (([a, b]: FolderItem[]) => number) | null { return null}

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