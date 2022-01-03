import 'virtual-table-component'
import { getProcessor } from '../processors/processor.js'
const ipcRenderer = window.require('electron').ipcRenderer
const fspath = window.require('path')

class Folder extends HTMLElement {
    constructor() {
        super()
        this.folderId = this.getAttribute("id")
        this.latestRequest = 0
        const additionalStyle = ".exif {color: var(--exif-color);} .isSelected .exif {color: var(--selected-exif-color); }"
        this.innerHTML = `
            <div class=folder>
                <input class=pathInput></input>
                <div class=folderroot>
                    <virtual-table additionalStyle='${additionalStyle}'></virtual-table>
                </div>
            </div`
        
        this.table = this.getElementsByTagName("VIRTUAL-TABLE")[0]
        this.folderRoot = this.getElementsByClassName("folderroot")[0]
        const sbr = this.getAttribute("scrollbar-right")
        if (sbr)
            this.table.setAttribute("scrollbar-right", sbr)
        
        this.backtrack = []
        this.backPosition = -1
        this.pathInput = this.getElementsByTagName("INPUT")[0]
        this.table.renderRow = (item, tr) => {
            tr.ondragstart = evt => this.onDragStart(evt)
            tr.ondrag = evt => this.onDrag(evt)
            tr.ondragend = evt => this.onDragEnd(evt)
            tr.onmousedown = evt => {
                if (evt.ctrlKey) {
                    setTimeout(() => {
                        const pos = this.table.getPosition()
                        this.table.items[pos].isSelected = !this.table.items[pos].isNotSelectable && !this.table.items[pos].isSelected 
                        this.table.refresh()
                    })
                }
            }
            this.processor.renderRow(item, tr)
        }
        const lastPath = localStorage.getItem(`${this.folderId}-lastPath`)
        this.changePath(lastPath)
    }

    get id() { return this.folderId }
    
    get selectedItems() { return this.getSelectedItems() }
    
    showHidden(hidden) {
        this.showHiddenItems = hidden
        this.reloadItems()
    }

    reloadItems() {
        this.changePath(this.processor.getCurrentPath())
    }

    selectAll() {
        this.table.items.forEach(n => n.isSelected = !n.isNotSelectable)
        this.table.refresh()
    }

    selectNone() {
        this.table.items.forEach(n => n.isSelected = false)
        this.table.refresh()
    }

    setFocus() { this.table.setFocus() }

    connectedCallback() {
        this.table.addEventListener("columnwidths", e => this.processor.saveWidths(e.detail))
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
            this.table.refresh()
        })

        this.table.addEventListener("enter", async evt => {
            const [path, recentFolder] = this.processor.getPath(this.table.items[evt.detail.currentItem])
            if (path) {
                await this.changePath(path)
                if (recentFolder) {
                    const index = this.table.items.findIndex(n => n.name == recentFolder)
                    this.table.setPosition(index)
                }
            }
        })

        this.table.addEventListener("delete", async evt => {
            const selectedItems = this.getSelectedItems()
            if (selectedItems.length > 0)
                this.dispatchEvent(new CustomEvent('delete', { detail: selectedItems }))
        })
                
        this.table.addEventListener("keydown", evt => {
            switch (evt.which) {
                case 8: // backspace
                    this.getHistoryPath(evt.shiftKey)
                    return
                case 9: // tab
                    if (evt.shiftKey) {
                        this.pathInput.focus()
                    } else 
                        this.dispatchEvent(new CustomEvent('tab', { detail: this.id }))
                    evt.preventDefault()
                    evt.stopPropagation()
                    break
                case 27: // Escape
                    this.selectNone()
                    break
                case 35: // end
                    if (evt.shiftKey) {
                        const pos = this.table.getPosition()
                        this.table.items.forEach((item, i) => item.isSelected = !item.isNotSelectable && i >= pos)                     
                        this.table.refresh()
                    }
                    break
                case 36: // home
                    if (evt.shiftKey) {
                        const pos = this.table.getPosition()
                        this.table.items.forEach((item, i) => item.isSelected = !item.isNotSelectable && i <= pos)                     
                        this.table.refresh()
                    }
                    break
                case 45: { // Ins
                    const pos = this.table.getPosition()
                    this.table.items[pos].isSelected = !this.table.items[pos].isNotSelectable && !this.table.items[pos].isSelected 
                    this.table.setPosition(pos + 1)
                    break
                }
            }
        })

        this.table.addEventListener("focusin", async evt => {
            this.dispatchEvent(new CustomEvent('onFocus', { detail: this.id }))
            this.sendStatusInfo(this.table.getPosition())
        })

        this.folderRoot.addEventListener("dragenter", evt => this.onDragEnter(evt))
        this.folderRoot.addEventListener("dragleave", evt => this.onDragLeave(evt))
        this.folderRoot.addEventListener("dragover", evt => this.onDragOver(evt))
        this.folderRoot.addEventListener("drop", evt => this.onDrop(evt))

        this.table.addEventListener("currentIndexChanged", evt => this.sendStatusInfo(evt.detail))
            
        this.pathInput.onkeydown = evt => {
            if (evt.which == 13) {
                this.changePath(this.pathInput.value)
                this.table.setFocus()
            }
        }
        this.pathInput.onfocus = () => setTimeout(() => this.pathInput.select())

        const viewerSplitter = document.getElementById("viewerSplitter")
    }

    getSelectedItem() {
        return this.table.items[this.table.getPosition()].name
    }

    async changePath(path, fromBacklog) {
        const result = getProcessor(this.folderId, path, this.processor)
        const req = ++this.latestRequest
        const itemsResult = (await result.processor.getItems(path, this.showHiddenItems))
        path = itemsResult.path
        let items = itemsResult.items
        if (!items || req < this.latestRequest) 
            return

        this.table.setItems([])
        if (result.changed) {
            this.processor = result.processor
            const columns = this.processor.getColumns()
            this.table.setColumns(columns)
            this.sortFunction = null
        }

        this.processor.disableSorting(this.table, true)

        const dirs = items.filter(n => n.isDirectory)
        const files = items.filter(n => !n.isDirectory)
        this.dirsCount = dirs.length
        this.filesCount = files.length

        if (this.sortFunction) 
            items = dirs.concat(files.sort(this.sortFunction))

        this.table.setItems(items)
        this.table.setRestriction((items, restrictValue) => 
            items.filter(n => n.name.toLowerCase()
                .startsWith(restrictValue.toLowerCase())
        ))
        
        this.onPathChanged(path, fromBacklog)
        setTimeout(async () => {
            await this.processor.addExtendedInfos(path, this.table.items, () => this.table.refresh())
            this.processor.disableSorting(this.table, false)
        })
    }

    onPathChanged(newPath, fromBacklog) {
        const path = newPath || this.processor.getCurrentPath()
        this.pathInput.value = path
        localStorage.setItem(`${this.folderId}-lastPath`, path)
        if (!fromBacklog) {
            this.backPosition++
            this.backtrack.length = this.backPosition
            if (this.backPosition == 0 || this.backtrack[this.backPosition - 1] != path)
                this.backtrack.push(path)
        }
    }

    getCurrentPath() {
        return this.processor.getCurrentPath()
    }

    getHistoryPath(forward) {
        if (!forward && this.backPosition >= 0) {
            this.backPosition--
            this.changePath(this.backtrack[this.backPosition], true)
        } else if (forward && this.backPosition < this.backtrack.length - 1) {
            this.backPosition++
            this.changePath(this.backtrack[this.backPosition], true)
        }
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

    async prepareCopyItems(fromLeft, itemsType, sourcePath, items, move) {
        const targetPath = this.processor.getCurrentPath()
        const copyInfo = {}
        copyInfo.items = await this.processor.extractFilesInFolders(sourcePath, targetPath, items)
        copyInfo.conflicts = await this.processor.getCopyConflicts(copyInfo.items, sourcePath)
        return this.processor.prepareCopyItems(move, itemsType, items.length == 1, fromLeft, copyInfo)
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

    sendStatusInfo(index) {
        if (this.table.items && this.table.items.length > 0)
            this.dispatchEvent(new CustomEvent('pathChanged', { detail: {
                path: this.processor.getItem(this.table.items[index]),
                dirs: this.dirsCount,
                files: this.filesCount
            }
        }))
    }

    onDragStart(evt) { 
        if (this.getSelectedItems()
                .map(n => n.name)
                .includes(this.table.items[this.table.getPosition()].name)) {
            evt.dataTransfer.setData("copyFiles", "JSON.stringify(files)")
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
        evt.stopPropagation()
        evt.preventDefault() // Necessary. Allows us to drop.
        if (!this.folderRoot.classList.contains("onDragStarted"))
            this.folderRoot.classList.add("isDragging")
    }

    onDragLeave() {
        this.folderRoot.classList.remove("isDragging")
    }

    onDragOver(evt) {
        if (this.folderRoot.classList.contains("isDragging")) {
            evt.dataTransfer.dropEffect = 
                evt.dataTransfer.allowedEffect == "move" 
                || evt.dataTransfer.effectAllowed == "copyMove"
                || evt.dataTransfer.effectAllowed == "linkMove"
                || evt.dataTransfer.effectAllowed == "all"
                ? "move" 
                : (evt.dataTransfer.allowedEffect == "copy" 
                    || evt.dataTransfer.effectAllowed == "copyMove"
                    || evt.dataTransfer.effectAllowed == "copyLink"
                    || evt.dataTransfer.effectAllowed == "all"
                    ? "copy"
                    : "none")
            if (evt.ctrlKey && evt.dataTransfer.dropEffect == "move" && (evt.dataTransfer.allowedEffect == "copy" 
                    || evt.dataTransfer.effectAllowed == "copyMove"
                    || evt.dataTransfer.effectAllowed == "copyLink"
                    || evt.dataTransfer.effectAllowed == "all"))
                evt.dataTransfer.dropEffect = "copy"
            this.dropEffect = evt.dataTransfer.dropEffect
            evt.preventDefault() // Necessary. Allows us to drop.
        }
    }

    onDrop(evt) {
        console.log("onDrop", evt) 
        const feilen = evt.dataTransfer.getData("copyFiles")
        console.log("feilen", feilen)
        evt.preventDefault()
        this.folderRoot.classList.remove("isDragging")
    }
}

customElements.define('folder-table', Folder)

// TODO Copy/Move with Drag'n'Drop
// TODO Copy conflicts: order by red, then green, then equal

// TODO Processor: CanAction 
// TODO Show trashinfo (show trash)
// TODO Undelete files
// TODO Empty trash
// TODO Copy with Copy Paste (from external or from internal)
// TODO When a path is not available anymore: fallback to root
// TODO ProgressControl: multiple progresses: show in ProgressBars in popovermenu, show latest in ProgressPie
// TODO Windows after copy: electron does not have focus. Old Commander is OK!!!!!!!

// TODO Status line (# files, # selected files), root
// TODO Status Linux: styling

// TODO xdg-open
// TODO retrieve copy conflicts only, if source folders and target folders are the same
// TODO Linux: copy to self

// TODO stack MessageBoxes