const fs = window.require('fs')
const { copy } = window.require('filesystem-utilities')

export function createCopyProcessor(onFinish, onExeption, onProgress) {

    var queue = []
    var size = 0
    var folderIdsToRefresh = []
    var isProcessing = false

    const process = async () => {
        while (true) {
            const job = queue.shift()
            if (!job) 
                break
            await copy(job.source, job.target, (c, t) => console.log(`Progress js ${c}, ${t}`), job.move || false)
        }
        size = 0

        onFinish(folderIdsToRefresh)
        folderIdsToRefresh = []
        isProcessing = false
    }

    const addJob = (source, target, move, foldersToRefresh) => {

        size += fs.statSync(source).size
        folderIdsToRefresh = [...new Set(folderIdsToRefresh.concat(foldersToRefresh))]

        queue.push({
            source, target, move
        })
       
        if (!isProcessing) {
            isProcessing = true
            process()
        }
    }

    return {
        addJob
    }
}

