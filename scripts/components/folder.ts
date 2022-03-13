import 'virtual-table-component'
import { TableItem, VirtualTable } from 'virtual-table-component'
import { ColumnsType, EngineType, GetItemResult, ItemType, request } from '../requests'

export interface FolderItem extends TableItem {
    name:         string
    isMounted?:   boolean
    isHidden?:    boolean
    isDirectory?: boolean
    itemType:     ItemType
    iconPath?:    boolean
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
            tr.onmousedown = evt => {
                if (evt.ctrlKey) {
                    setTimeout(() => {
                    })
                }
            }
            switch (this.engine) {
                case EngineType.Root:
                    if (!item.isMounted)
                        tr.style.opacity = "0.5"
                    break
                case EngineType.Directory:
                    tr.ondragstart = evt => this.onDragStart(evt)
                    tr.ondrag = evt => this.onDrag(evt)
                    tr.ondragend = () => this.onDragEnd()
                    if (item.isHidden)
                        tr.style.opacity = "0.5"
                    break
            }
        }

        this.changePath() 
        const lastPath = localStorage.getItem(`${this.folderId}-lastPath`)
        setTimeout(() => this.changePath(lastPath))
    }

    connectedCallback() {
        this.table.addEventListener("columnclick", evt => {
        })
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
            let currentItem = this.table.items[(evt as CustomEvent).detail.currentItem]
            if (currentItem.isDirectory) {
                await this.changePath(this.path, currentItem)            
            }
            // const { path, recentFolder } = await this.engine.getPath(, () => this.reloadItems())
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

    async changePath(path?: string|null, currentItem?: FolderItem, fromBacklog?: boolean) {
        const req = ++this.latestRequest
        let result = await request<GetItemResult>("getitems", {
            engine: this.engine,
            path,
            currentItem,
            showHiddenItems: this.showHiddenItems
        })
        if (req < this.latestRequest) 
            return 
        if (result.columns) {
            this.engine = result.engine
            this.table.setColumns(result.columns!.map(n => {
                switch (n.type) {
                    case ColumnsType.Name:
                        return { name: n.name, render: (td, item) => {
                            if (item.iconPath) {
                                const img = document.createElement("img")
                                img.src = `commander/geticon/${item.iconPath}`
                                img.classList.add("image")
                                td.appendChild(img)
                            } else {
                                var t = (item.itemType == ItemType.Harddrive
                                ? document.querySelector('#driveIcon') 
                                : item.itemType == ItemType.Parent
                                ? document.querySelector('#parentIcon')
                                : item.itemType == ItemType.Directory
                                ? document.querySelector('#folderIcon')
                                : document.querySelector('#homeIcon')) as HTMLTemplateElement
                                td.appendChild(document.importNode(t.content, true))
                            }

                            const span = document.createElement('span')
                            span.innerHTML = item.name
                            td.appendChild(span)
                        }}
                    case ColumnsType.Size:
                        return { name: n.name, isRightAligned: true, render: (td, item) => {
                            td.innerHTML = this.formatSize((item as any)[`${n.column}`])
                            td.classList.add("rightAligned")
                        }}
                    case ColumnsType.Time:
                        return { name: n.name, render: (td, item) => td.innerHTML = this.formatDateTime((item as any)[`${n.column}`]) }
                    default:
                        return { name: n.name, render: (td, item) => td.innerHTML= (item as any)[`${n.column}`]}
                }
            }), `${this.folderId}-${result.engine}`)
        }

        this.table.setItems(result.items)
        if (result.latestPath) {
            let index = result.items.findIndex(n => n.name == result.latestPath)
            if (index != -1)
                this.table.setPosition(index)
        }
        this.table.setRestriction((items, restrictValue) => 
            items.filter(n => n.name.toLowerCase()
                .startsWith(restrictValue.toLowerCase())
        ))

        this.onPathChanged(result.path, fromBacklog)

        // TODO GetIcons: GtkInit takes a certain time (Task Delay)
        // TODO GetIcons: LastModified: Program start DateTime Now
        // TODO GetIcons: without extension default extension
        // TODO GetIcons: Windows
        // TODO ExifDate
        // TODO Windows Version
        // TODO Sorting
        // TODO Access Denied Exception (Windows eigene Dokumente)
        // TODO Restriction with background
    }

    setFocus() { this.table.setFocus() }

    getCurrentPath() {
        return "" //this.engine.currentPath
    }

    getSelectedItems(): FolderItem[] {
        const selectedItems = this.table.items
            .filter(n => n.isSelected) 
        // if (selectedItems.length == 0 && this.table.getPosition() == 0 && this.table.items[0].name == "..")
        //     return []
        return selectedItems.length > 0
            ? selectedItems
            : [this.table.items[this.table.getPosition()]]
    }

    showHidden(hidden: boolean) {
        this.showHiddenItems = hidden
        this.reloadItems()
    }

    async reloadItems(keepSelection?: boolean) {
        const pos = keepSelection == true ? this.table.getPosition() : 0
        //this.table.items[pos].isSelected = this.engine.isSelectable(this.table.items[pos]) && !this.table.items[pos].isSelected 
        await this.changePath(this.path)
        if (pos)
            this.table.setPosition(pos)
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
        // if (this.getSelectedItems()
        //         .map(n => n.name)
        //         .includes(this.table.items[this.table.getPosition()].name)) {
        //     evt.dataTransfer?.setData("internalCopy", "true")
        //     this.folderRoot.classList.add("onDragStarted")
        // } else
        //     evt.preventDefault()
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

    private onPathChanged(newPath: string, fromBacklog?: boolean) {
        this.path = newPath
        this.pathInput!.value = this.path
        localStorage.setItem(`${this.folderId}-lastPath`, this.path)
        if (!fromBacklog) {
            this.backPosition++
            this.backtrack.length = this.backPosition
            if (this.backPosition == 0 || this.backtrack[this.backPosition - 1] != this.path)
                this.backtrack.push(this.path)
        }
    }

    private sendStatusInfo(index: number) {
    }

    private getHistoryPath(forward?: boolean) {
        if (!forward && this.backPosition >= 0) {
            this.backPosition--
            this.changePath(this.backtrack[this.backPosition], undefined, true)
        } else if (forward && this.backPosition < this.backtrack.length - 1) {
            this.backPosition++
            this.changePath(this.backtrack[this.backPosition], undefined, true)
        }
    }

    formatSize(size: number) {
        if (!size)
            return ""
        let sizeStr = size.toString()
        const sep = '.'
        if (sizeStr.length > 3) {
            var sizePart = sizeStr
            sizeStr = ""
            for (let j = 3; j < sizePart.length; j += 3) {
                const extract = sizePart.slice(sizePart.length - j, sizePart.length - j + 3)
                sizeStr = sep + extract + sizeStr
            }
            const strfirst = sizePart.substring(0, (sizePart.length % 3 == 0) ? 3 : (sizePart.length % 3))
            sizeStr = strfirst + sizeStr
        }
        return sizeStr    
    }

    formatDateTime = (dateStr: string) => {
        if (!dateStr || dateStr.startsWith("0001"))
            return ''
        const date = Date.parse(dateStr)
        return dateFormat.format(date) + " " + timeFormat.format(date)  
    }
    

    private table: VirtualTable<FolderItem>
    private latestRequest = 0
    private folderRoot: HTMLElement
    private folderId = ""
    private backtrack: string[] = []
    private backPosition = -1
    private pathInput: HTMLInputElement | null = null
    private dropEffect: "none" | "copy" | "move" = "none"
    private engine = EngineType.None
    private path = ""
    private showHiddenItems = false
}

customElements.define('folder-table', Folder)

var dateFormat = Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

var timeFormat = Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
})
