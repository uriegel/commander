const fs = window.require('fs')
const { copy } = window.require('filesystem-utilities')

export function createCopyProcessor(onCopyFinish, onShowErrors) {
    const progress = document.getElementById("progress")
    const progressError = document.getElementById("progressError")
    const progressErrorClose = document.getElementById("progressErrorClose")
    const errorTable = document.getElementById("error-table")

    progressError.onclick = () => {
        progressError.classList.add("hidden")
        setTimeout(async () => {
    
            const items = Array.from(Array(4000).keys())
                .map(index => ({
                name: "Eintrag " + index,
            }))
            
            setTimeout(() => {
                errorTable.setColumns([{
                    name: "Fehler aufgetreten",
                    render: (td, item) => td.innerHTML = item.name
                }])
                errorTable.setItems(items)
            })
    
            onShowErrors({
                text: "Fehler aufgetreten",
                btnOk: true,
                extended: "error-list"
            })
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
        copyExceptions.concat(err)
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

