const fs = window.require('fs')
const { copy } = window.require('filesystem-utilities')

export function createCopyProcessor(onFinish, onExeption, onProgress) {

    var queue = []
    var totalSize = 0
    var alreadyCopied = 0
    var folderIdsToRefresh = []
    var isProcessing = false

    const process = () => setTimeout(
        async () => {
            while (true) {
                const job = queue.shift()
                if (!job) 
                    break
                await copy(job.source, job.target, c => onProgress(alreadyCopied + c, totalSize), job.move || false)
                alreadyCopied += job.size
            }
            totalSize = 0
            alreadyCopied = 0
            onFinish(folderIdsToRefresh)
            folderIdsToRefresh = []
            isProcessing = false
        }
    )

    const addJob = (source, target, move, foldersToRefresh) => {

        const size = fs.statSync(source).size
        totalSize += size
        folderIdsToRefresh = [...new Set(folderIdsToRefresh.concat(foldersToRefresh))]

        queue.push({
            source, target, move, size
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

