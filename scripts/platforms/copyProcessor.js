const fs = window.require('fs')
const { copy } = window.require('filesystem-utilities')

export function createCopyProcessor(onCopyFinish, onShowErrors) {
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
                    await copy(job.source, job.target, c => onProgress(alreadyCopied + c, totalSize), job.move || false)
                } catch (err) {
                    onException(err)
                }
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

    function onProgress(current, total) {
        progress.classList.add("active")
        progress.setAttribute("progress", current / total * 100.0)
    }
    
    function onFinish(folderIdsToRefresh) {
        progress.classList.remove("active")
        onCopyFinish(folderIdsToRefresh)
    }
    
    function onException(err) {
        copyExceptions = copyExceptions.concat(err)

        // TODO if error dialog is open append
        progressError.classList.remove("hidden")
    }

    progressErrorClose.onclick = evt => {
        progressError.classList.add("hidden")
        activeFolder.setFocus()
        evt.preventDefault()
        evt.stopPropagation()
    }

    return {
        addJob
    }
}

