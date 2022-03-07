import 'virtual-table-component'
import { TableItem, VirtualTable } from 'virtual-table-component'

export interface FolderItem extends TableItem{
    name: string
    isDirectory: boolean
}

export class Folder extends HTMLElement {
    constructor() {
        super()
        this.folderId = this.getAttribute("id")!

        const additionalStyle = ".exif {color: var(--exif-color);} .isSelected .exif {color: var(--selected-exif-color); }"
        this.innerHTML = `
            <div class=folder>
                <input class=pathInput></input>
                <div class=folderroot>
                    <virtual-table additionalStyle='${additionalStyle}'></virtual-table>
                </div>
            </div`
        
        this.table = this.getElementsByTagName("VIRTUAL-TABLE")[0]! as VirtualTable<FolderItem>
        this.folderRoot = this.getElementsByClassName("folderroot")[0] as HTMLElement
        const sbr = this.getAttribute("scrollbar-right")
        if (sbr)
            this.table.setAttribute("scrollbar-right", sbr)
        this.pathInput = this.getElementsByTagName("INPUT")[0]! as HTMLInputElement

        this.table.renderRow = (item, tr) => {
            tr.ondragstart = evt => this.onDragStart(evt)
            tr.ondrag = evt => this.onDrag(evt)
            tr.ondragend = () => this.onDragEnd()
            tr.onmousedown = evt => {
                if (evt.ctrlKey) {
                    setTimeout(() => {
                    })
                }
            }
        }

        this.changePath() 
        const lastPath = localStorage.getItem(`${this.folderId}-lastPath`)
        setTimeout(() => this.changePath(lastPath))
    }

    connectedCallback() {
        this.table.addEventListener("columnclick", evt => {
        })
        //this.table.addEventListener("columnwidths", evt => this.engine.saveWidths((evt as CustomEvent).detail))
        this.table.addEventListener("currentIndexChanged", evt => this.sendStatusInfo((evt as CustomEvent).detail))
        this.table.addEventListener("focusin", async evt => {
            this.dispatchEvent(new CustomEvent('onFocus', { detail: this.id }))
            this.sendStatusInfo(this.table.getPosition())
        })
        this.table.addEventListener("delete", async evt => {
            const selectedItems = this.getSelectedItems()
            if (selectedItems.length > 0)
                this.deleteSelectedItems()
        })
        this.table.addEventListener("keydown", evt => {
            switch (evt.which) {
                case 8: // backspace
                    this.getHistoryPath(evt.shiftKey)
                    return
                case 9: // tab
                    if (evt.shiftKey) {
                        this.pathInput!.focus()
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
//                        const pos = this.table.getPosition()
          //              this.table.items.forEach((item, i) => item.isSelected = this.engine.isSelectable(item) && i >= pos)                     
            //            this.engine.beforeRefresh(this.table.items)
                        this.table.refresh()
                    }
                    break
                case 36: // home
                    if (evt.shiftKey) {
                        // const pos = this.table.getPosition()
                        // this.table.items.forEach((item, i) => item.isSelected = this.engine.isSelectable(item) && i <= pos)                     
                        // this.engine.beforeRefresh(this.table.items)
                        this.table.refresh()
                    }
                    break
                case 45: { // Ins
                    // const pos = this.table.getPosition()
                    // this.table.items[pos].isSelected = this.engine.isSelectable(this.table.items[pos]) && !this.table.items[pos].isSelected 
                    // this.engine.beforeRefresh(this.table.items)
//                    this.table.setPosition(pos + 1)
                    break
                }
            }
        })
        this.table.addEventListener("enter", async evt => {
            // const { path, recentFolder } = await this.engine.getPath(this.table.items[(evt as CustomEvent).detail.currentItem], () => this.reloadItems())
            // if (path) {
            //     await this.changePath(path)
            //     if (recentFolder) {
            //         const index = this.table.items.findIndex(n => n.name == recentFolder)
            //         this.table.setPosition(index)
            //     }
            // } else {
            //     this.engine.onEnter(this.table.items[(evt as CustomEvent).detail.currentItem].name)
            //     this.setFocus()
            // }
        })
        this.table.addEventListener("focusin", async evt => {
            this.dispatchEvent(new CustomEvent('onFocus', { detail: this.id }))
            this.sendStatusInfo(this.table.getPosition())
        })
        this.folderRoot.addEventListener("dragenter", () => this.onDragEnter())
        this.folderRoot.addEventListener("dragleave", () => this.onDragLeave())
        this.folderRoot.addEventListener("dragover", evt => this.onDragOver(evt))
        this.folderRoot.addEventListener("drop", evt => this.onDrop(evt))

        this.pathInput!.onkeydown = evt => {
            if (evt.which == 13) {
                this.changePath(this.pathInput!.value)
                this.table.setFocus()
            }
        }
        this.pathInput!.onfocus = () => setTimeout(() => this.pathInput!.select())
    }

    async changePath(path?: string|null, fromBacklog?: boolean) {
        

        console.log("changePath", this.id, path)

        const req = ++this.latestRequest


        // TODO getItems (?path=%path via fetch
        // TODO returns object with items and optional columns, currentPath, engineId
        // TODO items: files unsorted, directories with parent sorted
        // TODO if Some set Columns
        // set Items

        //if (!items || req < this.latestRequest) 
        if (req < this.latestRequest) 
            return        
    }

    setFocus() { this.table.setFocus() }

    getCurrentPath() {
        return "" //this.engine.currentPath
    }

    getSelectedItems(): FolderItem[] {
        const selectedItems = this.table.items
            .filter(n => n.isSelected) 
        if (selectedItems.length == 0 && this.table.getPosition() == 0 && this.table.items[0].name == "..")
            return []
        return selectedItems.length > 0
            ? selectedItems
            : [this.table.items[this.table.getPosition()]]
    }

    showHidden(hidden: boolean) {
        //this.showHiddenItems = hidden
        this.reloadItems()
    }

    async reloadItems(keepSelection?: boolean) {
        // const pos = keepSelection == true ? this.table.getPosition() : 0
        // this.table.items[pos].isSelected = this.engine.isSelectable(this.table.items[pos]) && !this.table.items[pos].isSelected 
        // await this.changePath(this.engine.currentPath)
        // if (pos)
        //     this.table.setPosition(pos)
    }

    selectAll() {
        // this.table.items.forEach(n => n.isSelected = this.engine.isSelectable(n))
        // this.engine.beforeRefresh(this.table.items)
        this.table.refresh()
    }

    selectNone() {
        this.table.items.forEach(n => n.isSelected = false)
//        this.engine.beforeRefresh(this.table.items)
        this.table.refresh()
    }

    onDragStart(evt: DragEvent) { 
        if (this.getSelectedItems()
                .map(n => n.name)
                .includes(this.table.items[this.table.getPosition()].name)) {
            evt.dataTransfer?.setData("internalCopy", "true")
            this.folderRoot.classList.add("onDragStarted")
        } else
            evt.preventDefault()
    }
    onDrag(evt: DragEvent) { 
    }
    onDragEnd() { 
        this.folderRoot.classList.remove("onDragStarted")
    }

    onDragEnter() {
        if (!this.folderRoot.classList.contains("onDragStarted"))
            this.folderRoot.classList.add("isDragging")
    }

    onDragLeave() {
        this.folderRoot.classList.remove("isDragging")
    }

    onDragOver(evt: DragEvent) {
        if (this.folderRoot.classList.contains("isDragging")) {
            evt.dataTransfer!.dropEffect = 
                evt.dataTransfer?.effectAllowed == "move" 
                || evt.dataTransfer?.effectAllowed == "copyMove"
                || evt.dataTransfer?.effectAllowed == "linkMove"
                || evt.dataTransfer?.effectAllowed == "all"
                ? "move" 
                : (evt.dataTransfer?.effectAllowed == "copy" 
                    || evt.dataTransfer?.effectAllowed == "copyLink"
                    ? "copy"
                    : "none")
            if (evt.ctrlKey && evt.dataTransfer?.dropEffect == "move" && (evt.dataTransfer.effectAllowed == "copy" 
                    || evt.dataTransfer.effectAllowed == "copyMove"
                    || evt.dataTransfer.effectAllowed == "copyLink"
                    || evt.dataTransfer.effectAllowed == "all"))
                evt.dataTransfer.dropEffect = "copy"
            this.dropEffect = evt.dataTransfer!.dropEffect
            evt.preventDefault() // Necessary. Allows us to drop.
        }
    }

    onDrop(evt: DragEvent) {
        if (evt.dataTransfer?.getData("internalCopy") == "true") {
            evt.preventDefault()
            this.dispatchEvent(new CustomEvent('dragAndDrop', { detail: this.dropEffect == "move" }))
        }
        this.folderRoot.classList.remove("isDragging")
    }

    renameItem() {
    }

    async extendedRename() {
    }

    deleteSelectedItems() {
    }

    createFolder() {
    }

    async copy(other: Folder, fromLeft: boolean, move?: boolean) {
    }

    private sendStatusInfo(index: number) {
    }

    private getHistoryPath(forward?: boolean) {
        if (!forward && this.backPosition >= 0) {
            this.backPosition--
            this.changePath(this.backtrack[this.backPosition], true)
        } else if (forward && this.backPosition < this.backtrack.length - 1) {
            this.backPosition++
            this.changePath(this.backtrack[this.backPosition], true)
        }
    }

    private table: VirtualTable<FolderItem>
    private latestRequest = 0
    private folderRoot: HTMLElement
    private folderId = ""
    private backtrack: string[] = []
    private backPosition = -1
    private pathInput: HTMLInputElement | null = null
    private dropEffect: "none" | "copy" | "move" = "none"
}

customElements.define('folder-table', Folder)

