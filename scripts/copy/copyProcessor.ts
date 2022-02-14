import { Settings } from "web-dialog-box"
import { FileError } from "../engines/file"
import { Platform } from "../platforms/platforms"

const fs = window.require('fs')
//const http = window.require('http')

export function initializeCopying(onCopyFinish: ()=>void, onShowErrors: (errorContent: Settings)=>Promise<void>) {
    copyProcessor = new CopyProcessor(onCopyFinish, onShowErrors)
}

export var copyProcessor : CopyProcessor

enum Type {
    Copy,
    CopyAndroid,
    DeleteEmptyFolders
}

class CopyProcessor {
    constructor (onCopyFinish: ()=>void, onShowErrors: (errorContent: Settings)=>Promise<void>) { 
        this.progressError.onclick = () => {
            this.progressError.classList.add("hidden")
            setTimeout(async () => {
                const items = this.copyExceptions.map(n => {
                    const item = document.createElement("div")
                    item.innerText = n.description
                    return item
                })
    
                this.errorList.innerText = ""
                items.forEach(n => this.errorList.appendChild(n))
        
                await onShowErrors({
                    text: "Fehler aufgetreten",
                    btnOk: true,
                    extended: "error-list"
                })
                this.copyExceptions = []
            })
        }

        this.progressErrorClose.onclick = evt => {
            this.progressError.classList.add("hidden")
            //activeFolder.setFocus()
            evt.preventDefault()
            evt.stopPropagation()
        }
    
    }

    private progress = document.getElementById("progress")!
    private progressError = document.getElementById("progressError") as HTMLElement
    private progressErrorClose = document.getElementById("progressErrorClose")!
    private errorList = document.getElementById("error-list") as HTMLElement
    private queue: Job[] = []
    private totalSize = 0
    private alreadyCopied = 0
    //private folderIdsToRefresh = []
    private isProcessing = false
    private copyExceptions: FileError[] = []

    private process = () => setTimeout(
        async () => {
            while (true) {
                const job = this.queue.shift()
                if (!job) 
                    break
                try {
                    switch (job.type) {
                        case Type.Copy:
                            await Platform.copyFileAsync(job.source, job.target, c => this.onProgress(this.alreadyCopied + c, this.totalSize), job.move, job.overwrite)
                            break
                        // case Type.CopyAndroid:
                        //     await copyAndroid(job.source, job.target, c => onProgress(alreadyCopied + c, totalSize), job.move || false, job.overwrite || false)
                        //     break
                        // case Type.DeleteEmptyFolders:
                        //     await deleteEmptyFolders(job.deleteEmptyFolders.path, job.deleteEmptyFolders.folders)
                        //     break
                    }
                } catch (err) {
                    this.onException(err)
                }
                this.alreadyCopied += job.size
            }
            this.totalSize = 0
            this.alreadyCopied = 0
            
            // TODO
            // onFinished(folderIdsToRefresh)
            //this.folderIdsToRefresh = []
            this.isProcessing = false
        }
    )

    // addDeleteEmptyFolders(path, folders, foldersToRefresh) {
    //     folderIdsToRefresh = [...new Set(folderIdsToRefresh.concat(foldersToRefresh))]
    //     queue.push({ deleteEmptyFolders: { path, folders }, type: DELETE_EMPTY_FOLDERS })

    //     if (!isProcessing) {
    //         isProcessing = true
    //         process()
    //     }
    // }

    //addJob(source: string, target: string, move: boolean, overwrite: boolean, foldersToRefresh, android) {
    addJob(source: string, target: string, move: boolean, overwrite: boolean) {
//        const size = android ? 1 : fs.statSync(source).size
        const size = fs.statSync(source).size
        this.totalSize += size
        //folderIdsToRefresh = [...new Set(folderIdsToRefresh.concat(foldersToRefresh))]

        this.queue.push({
            //source, target, move, overwrite, size, type: android ? COPY_ANDROID : COPY
            source, target, move, overwrite, size, type: Type.Copy
        })
       
        if (!this.isProcessing) {
            this.isProcessing = true
            this.process()
        }
    }

    onProgress(current: number, total: number) {
        this.progress.classList.add("active")
        this.progress.setAttribute("progress", (current / total * 100.0).toString())
    }
    
    // onFinished(folderIdsToRefresh) {
    //     progress.classList.remove("active")
    //     onCopyFinish(folderIdsToRefresh)
    // }
    
    onException(err: any) {
        this.copyExceptions = this.copyExceptions.concat(err)

        // TODO if error dialog is open append
        this.progressError.classList.remove("hidden")
    }
    
    // async function copyAndroid(source, target, onProgress, move, overwrite) {
    //     onProgress(0)

    //     const keepAliveAgent = new http.Agent({
    //         keepAlive: true,
    //         keepAliveMsecs: 40000
    //     })

    //     const pos = source.indexOf('/', 9)
    //     const ip = source.substring(8, pos)
    //     const path = source.substring(pos)

    //     let date = 0
    //     const download = async data => new Promise((res, rej) => {
    //         const file = fs.createWriteStream(target)
                        
    //         var payload = JSON.stringify(data)
    //         const req = http.request({
    //             hostname: ip,
    //             port: 8080,
    //             path: "/getfile",
    //             agent: keepAliveAgent,
    //             timeout: 40000,
    //             method: 'POST',
    //             headers: {
	// 				'Content-Type': 'application/json; charset=UTF-8',
	// 				'Content-Length': Buffer.byteLength(payload)
	// 			}            
    //         }, response => {
    //             date = response.headers["x-file-date"]
    //             return response.pipe(file)
    //         })

    //         file.on('finish', () => {
    //             if (date) {
    //                 const time = new Date(Number.parseInt(date))
    //                 try {
    //                     fs.utimesSync(target, time, time)
    //                 } catch(e) {
    //                     console.error("change time", e)
    //                 }
    //             }
    //             res()
    //         })

    //         req.on("error", rej)
    //         req.write(payload)
    //         req.end()        
    //     })

    //     await download({ path })
    //     onProgress(1)
    // }
}

type Job = {
    type: Type   
    size: number
    source: string
    target: string
    move: boolean
    overwrite: boolean
}