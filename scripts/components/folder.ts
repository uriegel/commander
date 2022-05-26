import 'virtual-table-component'
import './copyconflicts'
import { TableItem, VirtualTable } from 'virtual-table-component'
import { compose } from '../functional'
import { ActionType, Column, ColumnsType, ConflictItem, EngineType, GetActionTextResult, GetFilePathResult, GetItemResult, IOError, IOErrorResult, ItemType, request } from '../requests'
import { addRemotes, initRemotes } from '../remotes'
import { DialogBox, Result } from 'web-dialog-box'
import { CopyConflicts } from './copyconflicts'

var latestRequest = 0

export type Version = {
    major: number
    minor: number
    patch: number
    build: number
}

export interface FolderItem extends TableItem {
    index?:       number
    name:         string
    isMounted?:   boolean
    isHidden?:    boolean
    isDirectory?: boolean
    selectable:   boolean
    itemType:     ItemType
    iconPath?:    string
    exifTime?:    string
    version?:     Version
}

type EnhancedInfo = {
    Case: "EnhancedInfo",
    Fields: Array<FolderItem[]>
}
type GetItemsFinished = {
    Case: "GetItemsFinished"
}

type FolderEvent = 
    | EnhancedInfo
    | GetItemsFinished

const dialog = document.querySelector('dialog-box') as DialogBox    

export function getExtension (path: string) {
    let index = path.lastIndexOf(".")
    return index > 0 ? path.substring(index) : ""
}

export function formatDateTime(dateStr: string) {
    if (!dateStr || dateStr.startsWith("0001"))
        return ''
    const date = Date.parse(dateStr)
    return dateFormat.format(date) + " " + timeFormat.format(date)  
}

export type IconItem = {
    name:      string
    iconPath?: string
    itemType:  ItemType
}
    

export function renderIcon(td: HTMLTableCellElement, item: IconItem) {
    if (item.iconPath) {
        const img = document.createElement("img")
        img.src = `commander/geticon?path=${item.iconPath}`
        img.classList.add("image")
        td.appendChild(img)
    } else {
        var t = (item.itemType == ItemType.Harddrive
        ? document.querySelector('#driveIcon') 
        : item.itemType == ItemType.Parent
        ? document.querySelector('#parentIcon')
        : item.itemType == ItemType.Directory
        ? document.querySelector('#folderIcon')
        : item.itemType == ItemType.File
        ? document.querySelector('#fileIcon')
        : item.itemType == ItemType.Remotes
        ? document.querySelector('#remoteIcon')
        : item.itemType == ItemType.AddRemote
        ? document.querySelector('#newIcon')
        : item.itemType == ItemType.Remote
        ? document.querySelector('#remoteIcon')
        : item.itemType == ItemType.AndroidRemote
        ? document.querySelector('#androidIcon')
        : document.querySelector('#homeIcon')) as HTMLTemplateElement
        td.appendChild(document.importNode(t.content, true))
    }
    const span = document.createElement('span')
    span.innerHTML = item.name
    td.appendChild(span)
}

export function formatSize(size: number) {
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
        initRemotes(this.folderId)

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

        this.source = new EventSource(this.id == "folderLeft" ? "commander/sseLeft" : "commander/sseRight")
        this.source.addEventListener("message", event => {
            const folderEvent: FolderEvent = JSON.parse(event.data)
            this.onEvent(folderEvent)
        })

        this.changePath() 
        const lastPath = localStorage.getItem(`${this.folderId}-lastPath`)
        setTimeout(() => this.changePath(lastPath))
    }

    connectedCallback() {
        this.table.addEventListener("columnclick", evt => {
            const detail = (evt as CustomEvent).detail
            const sortfn = this.getSortFunction(this.columns[detail.column].column, this.columns[detail.column].type, detail.subItem)
            if (!sortfn)
                return
            const ascDesc = (sortResult: number) => detail.descending ? -sortResult : sortResult
            this.sortFunction = compose(ascDesc, sortfn) 
            this.table.restrictClose()
            const dirs = (this.table.items as FolderItem[]).filter(n => n.isDirectory)
            const files = (this.table.items as FolderItem[]).filter(n => !n.isDirectory) 
            const pos = this.table.getPosition()
            const item = this.table.items[pos]
            this.table.items = dirs.concat(files.sort((a, b) => this.sortFunction!([a, b])))
            const newPos = this.table.items.findIndex(n => n.name == item.name)
            this.table.setPosition(newPos)
            this.table.refresh()
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
                    if (evt.shiftKey) 
                        this.pathInput!.focus()
                    else 
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
                        this.table.items.forEach((item, i) => item.isSelected = item.selectable && i >= pos)                     
            //            this.engine.beforeRefresh(this.table.items)
                        this.table.refresh()
                    }
                    break
                case 36: // home
                    if (evt.shiftKey) {
                        const pos = this.table.getPosition()
                        this.table.items.forEach((item, i) => item.isSelected = item.selectable && i <= pos)                     
                        // this.engine.beforeRefresh(this.table.items)
                        this.table.refresh()
                    }
                    break
                case 45: { // Ins
                    const pos = this.table.getPosition()
                     this.table.items[pos].isSelected = this.table.items[pos].selectable && !this.table.items[pos].isSelected 
                    // this.engine.beforeRefresh(this.table.items)
                    this.table.setPosition(pos + 1)
                    break
                }
            }
        })
        this.table.addEventListener("enter", async evt => {
            let currentItem = this.table.items[(evt as CustomEvent).detail.currentItem]
            if (currentItem.itemType == ItemType.AddRemote) {
                await addRemotes(this.folderId)
                this.reloadItems()
                this.table.setFocus()
            }
            else if (currentItem.isDirectory) 
                await this.changePath(this.path, currentItem)            
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
        this.requestId = ++latestRequest
        const requestId = this.requestId
        this.disableSorting(true)
        let result = await request<GetItemResult>("getitems", {
            folderId: this.folderId,
            requestId,
            engine: this.engine,
            path,
            currentItem,
            showHiddenItems: this.showHiddenItems
        })
        if (requestId < this.requestId) 
            return 
        if (result.columns) {
            this.engine = result.engine
            this.columns = result.columns
            this.sortFunction = null
            this.enhancedIndexes = []
            this.table.setColumns(result.columns!.map((n, i) => {
                switch (n.type) {
                    case ColumnsType.Name:
                    case ColumnsType.NameExtension:
                        return { 
                            name: n.name, 
                            isSortable: true, 
                            subItem: n.type == ColumnsType.NameExtension
                                ? { name: "Ext." }
                                : undefined,
                            render: renderIcon
                        }
                    case ColumnsType.Size:
                        return { name: n.name, isRightAligned: true, isSortable: true, render: (td, item) => {
                            td.innerHTML = formatSize((item as any)[n.column])
                            td.classList.add("rightAligned")
                        }}
                    case ColumnsType.Time:
                        this.enhancedIndexes = this.enhancedIndexes.concat([i])
                        return { name: n.name, isSortable: true, render: (td, item) =>  {
                                td.innerHTML = formatDateTime(item.exifTime || (item as any)[n.column]) 
                                if (item.exifTime)
                                    td.classList.add("exif")
                            }}
                    case ColumnsType.Version:
                        this.enhancedIndexes = this.enhancedIndexes.concat([i])
                        return { name: n.name, isSortable: true, render: (td, item) =>  td.innerHTML = this.formatVersion(item.version) }
                    default:
                        return { name: n.name, render: (td, item) => td.innerHTML= (item as any)[n.column]}
                }
            }), `${this.folderId}-${result.engine}`)
            this.sortFunction = this.getSortFunction(this.columns[0].column, this.columns[0].type, false)
        }

        if (!result.withEnhanced)
            this.disableSorting(false)

        this.items = result.items
        const dirs = result.items.filter(n => n.isDirectory)
        const files = result.items.filter(n => !n.isDirectory)
        this.dirsCount = dirs.length
        this.filesCount = files.length

        if (this.sortFunction) 
            result.items = dirs.concat(files.sort((a, b) => this.sortFunction!([a, b])))        

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

        // TODO Copy/Move
        // TODO Copy/Move Conflicts: default yes or no
        // TODO Copy/Move with admin commander: admincommander requests (post) progress to commander
        // TODO Copy/Move Conflicts: Version
        // TODO delete remotes
        // TODO Windows Title Icon is blurry
        // TODO Adapt Yaru theme
        // TODO when Time sorting, then sort after exif or disable time sort
        // TODO remote engine
        // TODO GetFileItems native faster with pinvoke
        // TODO Race condition getItems/sendEnhancedInfo
        // TODO Remote engine: parent select last folder    
        // TODO Strings always from F# as Resource strings (Culture)    
        // TODO qmlnet    
        // TODO Fullscreen: Windows hide menu
        // TODO Windows: no hide menu item
    }

    setFocus() { this.table.setFocus() }

    getCurrentPath() {
        return this.path
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
        this.showHiddenItems = hidden
        this.reloadItems()
    }

    async reloadItems(keepSelection?: boolean) {
        const pos = keepSelection == true ? this.table.getPosition() : 0
        this.table.items[pos].isSelected = this.table.items[pos].selectable && !this.table.items[pos].isSelected 
        await this.changePath(this.path)
        if (pos)
            this.table.setPosition(pos)
    }

    selectAll() {
        this.table.items.forEach(n => n.isSelected = n.selectable)
        //this.engine.beforeRefresh(this.table.items)
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

    async extendedRename() {
    }

    async deleteSelectedItems() {
        var items = this.getSelectedItems()
        const [dirs, files] = this.getSelectedItemsOverview(items)
        let texts = await request<GetActionTextResult>("getactionstexts", {
            engineType: this.engine,
            type:       ActionType.Delete,
            dirs,
            files
        }) 
        if (!texts.result)
            return
        const res = await dialog.show({
            text: texts.result,
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        this.setFocus()
        if (res.result == Result.Ok) {
            const ioResult = await request<IOErrorResult>("deleteitems", {
                engine: this.engine,
                path: this.getCurrentPath(),
                items: items.map(n => n.name)
            })
            this.checkResult(ioResult.error) 
        }
    }

    async onRename() {
        var items = this.getSelectedItems()
        const [dirs, files] = this.getSelectedItemsOverview(items)
        if (dirs + files != 1)
            return
        let texts = await request<GetActionTextResult>("getactionstexts", {
            engineType: this.engine,
            type: ActionType.Rename,
            dirs,
            files
        })
        if (!texts.result)
            return
        var item = items[0]

        const getInputRange = () => {
            const pos = item.name.lastIndexOf(".")
            if (pos == -1)
                return [0, item.name.length]
            else
                return [0, pos]
        }
        const res = await dialog.show({
            text: texts.result,
            inputText: item.name,
            inputSelectRange: getInputRange(),
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        this.setFocus()
        if (res.result == Result.Ok && res.input) {
            const ioResult = await request<IOErrorResult>("renameitem", {
                engine:  this.engine,
                path:    this.getCurrentPath(),
                name:    item.name,
                newName: res.input
            })
            this.checkResult(ioResult.error) 
        }
    }
    
    async createFolder() {
        var items = this.getSelectedItems()
        const [dirs, files] = this.getSelectedItemsOverview(items)
        let texts = await request<GetActionTextResult>("getactionstexts", {
            engineType: this.engine,
            type:       ActionType.CreateFolder,
            dirs,
            files
        }) 
        if (!texts.result)
            return
        const res = await dialog.show({
            text: texts.result,
            inputText: items.length == 1 ? items[0].name : "",
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        this.setFocus()
        if (res.result == Result.Ok && res.input) {
            const ioResult = await request<IOErrorResult>("createfolder", {
                engine: this.engine,
                path: this.getCurrentPath(),
                name: res.input
            })
            this.checkResult(ioResult.error) 
        }
    }

    async copy(other: Folder, fromLeft: boolean, move?: boolean) {
        var items = this.getSelectedItems()
        const [dirs, files] = this.getSelectedItemsOverview(items)
        if (dirs + files == 0)
            return

        let conflicts = await request<ConflictItem[]>("getcopyconflicts", {
            sourceEngineType: this.engine,
            sourcePath: this.path,
            targetEngineType: other.engine,
            targetPath: other.path,
            items: items.map(n => n.name)
        })

        let texts = await request<GetActionTextResult>("getactionstexts", {
            engineType: this.engine,
            otherEngineType: other.engine,
            type: move ? ActionType.Move : ActionType.Copy,
            dirs,
            files
        })
        if (!texts.result)
            return

        const settings = conflicts.length == 0
            ? {
                text: texts.result,
                slide: fromLeft,
                slideReverse: !fromLeft,
                btnCancel: true,
                btnOk: true,
                defBtnOk: true
            }
            : {
                text: texts.result,
                slide: fromLeft,
                slideReverse: !fromLeft,
                btnCancel: true,
                extended: "copy-conflicts",
                btnYes: true,
                btnNo: true,
                fullscreen: true,
                defBtnNo: true
            }
        
        if (conflicts.length > 0) {
            const copyConflicts = document.getElementById('copy-conflicts') as CopyConflicts
            copyConflicts.setItems(conflicts)
        }
        
            
        console.log("conflicts", conflicts)
        // TODO: if no conflicts show dialog
        // TODO: if conflicts show dialog with conflict overview


        const res = await dialog.show(settings)
        this.setFocus()
        if (res.result == Result.Ok && res.input) {
            // const ioResult = await request<IOErrorResult>("createfolder", {
            //     engine: this.engine,
            //     path: this.getCurrentPath(),
            //     name: res.input
            // })
            // this.checkResult(ioResult.error) 
        }
    }

    private checkResult(error: IOError) {
        if (!error) 
            this.reloadItems(true)
        else {
            const text = error.Case == "AccessDenied" 
                        ? "Zugriff verweigert"
                        : error.Case == "DeleteToTrashNotPossible"
                        ? "Löschen nicht möglich"
                        : error.Case == "AlreadyExists"
                        ? "Das Element existiert bereits"
                        : error.Case == "FileNotFound"
                        ? "Das Element ist nicht vorhanden"
                        : "Die Aktion konnte nicht ausgeführt werden"
            setTimeout(async () => { await dialog.show({
                    text,
                    btnOk: true
                })
                this.setFocus()        
            }, 500)                
        }
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

    private onEvent(evt: FolderEvent) {
        switch (evt.Case) {
            case "EnhancedInfo": 
                evt.Fields[0].forEach(n => {
                    if (n.exifTime) 
                        this.items[n.index!].exifTime = n.exifTime
                        //this.table.items[n.index!].exifTime = n.exifTime
                    if (n.version) 
                        this.items[n.index!].version = n.version
                })            
                this.table.refresh()
                break
            case "GetItemsFinished":
                this.disableSorting(false)
                break
        }
    }

    private async sendStatusInfo(index: number) {
        if (this.table.items && this.table.items.length > 0) {
            this.requestStatusId = ++latestRequest
            const requestId = this.requestStatusId
            const path = await this.getFilePath(this.table.items[index])
            if (requestId == this.requestStatusId)
                this.dispatchEvent(new CustomEvent('pathChanged', { detail: {
                    path,
                    dirs: this.dirsCount,
                    files: this.filesCount
                }}))
        }
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

    private async getFilePath(currentItem: FolderItem) {
        let result = await request<GetFilePathResult>("getfilepath", {
            engine: this.engine,
            path: this.path,
            currentItem,
        })
        return result.path
    }

    private formatVersion = (version?: Version) => {
        return version ? `${version.major}.${version.minor}.${version.build}.${version.patch}` : ""
    }

    private getSortFunction(column: string, columnType: ColumnsType, isSubItem: boolean): (([a, b]: FolderItem[]) => number) | null {
        switch (columnType) {
            case ColumnsType.Name:
                return ([a, b]: FolderItem[]) => a.name.localeCompare(b.name) 
            case ColumnsType.NameExtension:
                return isSubItem 
                    ? ([a, b]: FolderItem[]) => getExtension(a.name).localeCompare(getExtension(b.name)) 
                    : ([a, b]: FolderItem[]) => a.name.localeCompare(b.name) 
            case ColumnsType.Time:
                return ([a, b]: FolderItem[]) => {
                    let aa = a.exifTime ? a.exifTime! : (a as any)[column] as string
                    let bb = b.exifTime ? b.exifTime! : (b as any)[column] as string
                    return aa.localeCompare(bb) 
                } 
            case ColumnsType.Size:
                return ([a, b]: FolderItem[]) => (a as any)[column] - (b as any)[column]
            case ColumnsType.Version:
                return ([a, b]: FolderItem[]) => this.compareVersion((a as any)[column], (b as any)[column])
            default:
                return null
        }
    }

    private disableSorting(disable: boolean) {
        this.enhancedIndexes.forEach(n => this.table.disableSorting(n, disable))
    }
   
    private compareVersion(versionLeft: Version, versionRight: Version) {
        return !versionLeft
            ? -1
            : !versionRight
            ? 1
            : versionLeft.major != versionRight.major 
            ? versionLeft.major - versionRight.major
            : versionLeft.minor != versionRight.minor
            ? versionLeft.minor - versionRight.minor
            : versionLeft.patch != versionRight.patch
            ? versionLeft.patch - versionRight.patch
            : versionLeft.build - versionRight.build
    }

    private getSelectedItemsOverview(items: FolderItem[]) {
        const dirs = items.filter(n => n.isDirectory).length
        const files = items.filter(n => !n.isDirectory).length
        return [dirs, files]
    }

    private source: EventSource
    private table: VirtualTable<FolderItem>
    private folderRoot: HTMLElement
    private folderId = ""
    private items: FolderItem[] = []
    private backtrack: string[] = []
    private backPosition = -1
    private pathInput: HTMLInputElement | null = null
    private dropEffect: "none" | "copy" | "move" = "none"
    private engine = EngineType.None
    private path = ""
    private showHiddenItems = false
    private requestId = 0
    private requestStatusId = 0
    private columns: Column[] = []
    private sortFunction: ((row: [a: FolderItem, b: FolderItem]) => number) | null = null
    private enhancedIndexes: number[] = []
    private dirsCount = 0
    private filesCount = 0
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


