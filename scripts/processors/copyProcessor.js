const fs = window.require('fs')
const http = window.require('http')
const { copy } = window.require('filesystem-utilities')
const { deleteEmptyFolders } = window.require ("shared-module")

export function initializeCopying(onFinishCallback, onShowCopyErrors) {
    copyProcessor = createCopyProcessor(onFinishCallback, onShowCopyErrors)
}

export var copyProcessor
export var onFinish

const COPY = 1
const COPY_ANDROID = 2
const DELETE_EMPTY_FOLDERS = 3

function createCopyProcessor(onCopyFinish, onShowErrors) {
    onFinish = onCopyFinish
    const progress = document.getElementById("progress")
    const progressError = document.getElementById("progressError")
    const progressErrorClose = document.getElementById("progressErrorClose")
    const errorList = document.getElementById("error-list")

    progressError.onclick = () => {
        progressError.classList.add("hidden")
        setTimeout(async () => {

            const items = copyExceptions.map(n => {
                const item = document.createElement("div")
                item.innerText = n.description
                return item
            })

            errorList.innerText = ""
            items.forEach(n => errorList.appendChild(n))
    
            await onShowErrors({
                text: "Fehler aufgetreten",
                btnOk: true,
                extended: "error-list"
            })
            copyExceptions = []
        })
    }
    
    var queue = []
    var totalSize = 0
    var alreadyCopied = 0
    var folderIdsToRefresh = []
    var isProcessing = false
    var copyExceptions = []

    const process = () => setTimeout(
        async () => {
            while (true) {
                const job = queue.shift()
                if (!job) 
                    break
                try {
                    switch (job.type) {
                        case COPY:
                            await copy(job.source, job.target, c => onProgress(alreadyCopied + c, totalSize), job.move || false, job.overwrite || false)
                            break
                        case COPY_ANDROID:
                            await copyAndroid(job.source, job.target, c => onProgress(alreadyCopied + c, totalSize), job.move || false, job.overwrite || false)
                            break
                        case DELETE_EMPTY_FOLDERS:
                            await deleteEmptyFolders(job.deleteEmptyFolders.path, job.deleteEmptyFolders.folders)
                            break
                    }
                } catch (err) {
                    onException(err)
                }
                alreadyCopied += job.size
            }
            totalSize = 0
            alreadyCopied = 0
            onFinished(folderIdsToRefresh)
            folderIdsToRefresh = []
            isProcessing = false
        }
    )

    const addDeleteEmptyFolders = (path, folders, foldersToRefresh) => {
        folderIdsToRefresh = [...new Set(folderIdsToRefresh.concat(foldersToRefresh))]
        queue.push({ deleteEmptyFolders: { path, folders, type: DELETE_EMPTY_FOLDERS } })

        if (!isProcessing) {
            isProcessing = true
            process()
        }
    }

    const addJob = (source, target, move, overwrite, foldersToRefresh, android) => {

        const size = android ? 1 : fs.statSync(source).size
        totalSize += size
        folderIdsToRefresh = [...new Set(folderIdsToRefresh.concat(foldersToRefresh))]

        queue.push({
            source, target, move, overwrite, size, type: android ? COPY_ANDROID : COPY
        })
       
        if (!isProcessing) {
            isProcessing = true
            process()
        }
    }

    function onProgress(current, total) {
        progress.classList.add("active")
        progress.setAttribute("progress", current / total * 100.0)
    }
    
    function onFinished(folderIdsToRefresh) {
        progress.classList.remove("active")
        onCopyFinish(folderIdsToRefresh)
    }
    
    function onException(err) {
        copyExceptions = copyExceptions.concat(err)

        // TODO if error dialog is open append
        progressError.classList.remove("hidden")
    }
    
    async function copyAndroid(source, target, onProgress, move, overwrite) {
        onProgress(0)

        const keepAliveAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 40000
        })

        const pos = source.indexOf('/', 9)
        const ip = source.substring(8, pos)
        const path = source.substring(pos)

        let date = 0
        const download = async data => new Promise((res, rej) => {
            const file = fs.createWriteStream(target)
                        
            var payload = JSON.stringify(data)
            const req = http.request({
                hostname: ip,
                port: 8080,
                path: "/getfile",
                agent: keepAliveAgent,
                timeout: 40000,
                method: 'POST',
                headers: {
					'Content-Type': 'application/json; charset=UTF-8',
					'Content-Length': Buffer.byteLength(payload)
				}            
            }, response => {
                date = response.headers["x-file-date"]
                return response.pipe(file)
            })

            file.on('finish', () => {
                if (date) {
                    const time = new Date(Number.parseInt(date))
                    try {
                        fs.utimesSync(target, time, time)
                    } catch(e) {
                        console.error("change time", e)
                    }
                }
                res()
            })

            req.on("error", rej)
            req.write(payload)
            req.end()        
        })

        await download({ path })
        onProgress(1)
    }

    progressErrorClose.onclick = evt => {
        progressError.classList.add("hidden")
        activeFolder.setFocus()
        evt.preventDefault()
        evt.stopPropagation()
    }

    return {
        addJob,
        addDeleteEmptyFolders
    }
}

