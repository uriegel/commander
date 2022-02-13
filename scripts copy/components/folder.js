const ipcRenderer = window.require('electron').ipcRenderer
const fspath = window.require('path')

class Folder extends HTMLElement {
   
    connectedCallback() {
        this.folderRoot.addEventListener("dragenter", evt => this.onDragEnter(evt))
        this.folderRoot.addEventListener("dragleave", evt => this.onDragLeave(evt))
        this.folderRoot.addEventListener("dragover", evt => this.onDragOver(evt))
        this.folderRoot.addEventListener("drop", evt => this.onDrop(evt))
    }

    async getFilesInfos(files, subPath) {
        return await this.processor.getFilesInfos(files, subPath)
    }

    async copyItems(copyInfo, move, overwrite, foldersToRefresh) {
        await this.processor.copyItems(copyInfo, move, overwrite, foldersToRefresh)
    }

    async deleteEmptyFolders(folders, foldersToRefresh) {
        await this.processor.deleteEmptyFolders(this.getCurrentPath(), folders, foldersToRefresh)
    }

    onDragStart(evt) { 
        if (this.getSelectedItems()
                .map(n => n.name)
                .includes(this.table.items[this.table.getPosition()].name)) {
            evt.dataTransfer.setData("internalCopy", "true")
            this.folderRoot.classList.add("onDragStarted")
        } else
            evt.preventDefault()
    }
    onDrag(evt) { 
        if (evt.screenX == 0 && evt.screenY == 0) {
            ipcRenderer.send("dragStart", this.selectedItems.map(n => fspath.join(this.getCurrentPath(), n.name)))
            this.folderRoot.classList.remove("onDragStarted")
            evt.preventDefault()
        } 
    }
    onDragEnd(evt) { 
        this.folderRoot.classList.remove("onDragStarted")
    }

    onDragEnter(evt) {
        if (!this.folderRoot.classList.contains("onDragStarted"))
            this.folderRoot.classList.add("isDragging")
    }

    onDragLeave() {
        this.folderRoot.classList.remove("isDragging")
    }

    onDragOver(evt) {
        if (this.folderRoot.classList.contains("isDragging")) {
            evt.dataTransfer.dropEffect = 
                evt.dataTransfer.effectAllowed == "move" 
                || evt.dataTransfer.effectAllowed == "copyMove"
                || evt.dataTransfer.effectAllowed == "linkMove"
                || evt.dataTransfer.effectAllowed == "all"
                ? "move" 
                : (evt.dataTransfer.effectAllowed == "copy" 
                    || evt.dataTransfer.effectAllowed == "copyMove"
                    || evt.dataTransfer.effectAllowed == "copyLink"
                    || evt.dataTransfer.effectAllowed == "all"
                    ? "copy"
                    : "none")
            if (evt.ctrlKey && evt.dataTransfer.dropEffect == "move" && (evt.dataTransfer.effectAllowed == "copy" 
                    || evt.dataTransfer.effectAllowed == "copyMove"
                    || evt.dataTransfer.effectAllowed == "copyLink"
                    || evt.dataTransfer.effectAllowed == "all"))
                evt.dataTransfer.dropEffect = "copy"
            this.dropEffect = evt.dataTransfer.dropEffect
            evt.preventDefault() // Necessary. Allows us to drop.
        }
    }

    onDrop(evt) {
        if (evt.dataTransfer.getData("internalCopy") == "true") {
            evt.preventDefault()
            this.dispatchEvent(new CustomEvent('dragAndDrop', { detail: this.dropEffect == "move" }))
        }
        this.folderRoot.classList.remove("isDragging")
    }

    get extendedRename() { return this.isExtendedRename }
    set extendedRename(value) {
        this.isExtendedRename = value
        this.columnsChangeRequest = true
        this.reloadItems()
    }
    
    computeExtendedNewNames() {

        const formatNewName = (n, i) => { 
            const ext = getExtension(n.name)
            n.newName =
                `${this.isExtendedRename.prefix}${String(i + Number.parseInt(this.isExtendedRename.start)).padStart(Number.parseInt(this.isExtendedRename.digits), '0')}${ext}`
        }

        if (this.isExtendedRename) {
            this.table.items
                .filter(n => !n.isSelected)
                .forEach(n => n.newName = "")
            this.table.items
                .filter(n => n.isSelected)
                .forEach(formatNewName)
        }
    }
    
    doExtendedRename() {
        console.log("Extended renaming", this.table.items.filter(n => n.isSelected))
    }
}


