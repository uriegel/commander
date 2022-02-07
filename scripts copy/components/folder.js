const ipcRenderer = window.require('electron').ipcRenderer
const fspath = window.require('path')

class Folder extends HTMLElement {

    get id() { return this.folderId }
    
    get selectedItems() { return this.getSelectedItems() }
    
    connectedCallback() {
        this.table.addEventListener("columnclick", e => {
            const sortfn = this.processor.getSortFunction(e.detail.column, e.detail.subItem)
            if (!sortfn)
                return
            const ascDesc = sortResult => e.detail.descending ? -sortResult : sortResult
            this.sortFunction = composeFunction(ascDesc, sortfn) 
            this.table.restrictClose()
            const dirs = this.table.items.filter(n => n.isDirectory)
            const files = this.table.items.filter(n => !n.isDirectory)
            const pos = this.table.getPosition()
            const item = this.table.items[pos]
            this.table.items = dirs.concat(files.sort(this.sortFunction))
            const newPos = this.table.items.findIndex(n => n.name == item.name)
            this.table.setPosition(newPos)
            this.computeExtendedNewNames()
            this.table.refresh()
        })

        this.table.addEventListener("delete", async evt => {
            const selectedItems = this.getSelectedItems()
            if (selectedItems.length > 0)
                this.dispatchEvent(new CustomEvent('delete', { detail: selectedItems }))
        })
                
        this.folderRoot.addEventListener("dragenter", evt => this.onDragEnter(evt))
        this.folderRoot.addEventListener("dragleave", evt => this.onDragLeave(evt))
        this.folderRoot.addEventListener("dragover", evt => this.onDragOver(evt))
        this.folderRoot.addEventListener("drop", evt => this.onDrop(evt))
    }

    getSelectedItem() {
        return this.table.items[this.table.getPosition()].name
    }

    getSelectedItems() {
        const selectedItems = this.table.items
            .filter(n => n.isSelected) 
        if (selectedItems.length == 0 && this.table.getPosition() == 0 && this.table.items[0].name == "..")
            return []
        return selectedItems.length > 0
            ? selectedItems
            : [this.table.items[this.table.getPosition()]]
    }

    async createFolder(newFolder) {
        await this.processor.createFolder(newFolder)
        this.reloadItems()
    }

    async deleteItems(items) {
        await this.processor.deleteItems(items)
        this.reloadItems()
    }

    async prepareCopyItems(fromLeft, itemsType, sourcePath, items, move, sourceFolder) {
        const targetPath = this.processor.getCurrentPath()
        const copyInfo = {}
        copyInfo.items = await this.processor.extractFilesInFolders(sourcePath, targetPath, items, sourceFolder)
        copyInfo.conflicts = await this.processor.getCopyConflicts(copyInfo.items, sourcePath, sourceFolder)
        return this.processor.prepareCopyItems(move, itemsType, items.length == 1, fromLeft, copyInfo)
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

    async renameItem(item, newName) {
        await this.processor.renameItem(item, newName)
        this.reloadItems()
    }

    readDir(path) {
        return this.processor.readDir(path)
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


