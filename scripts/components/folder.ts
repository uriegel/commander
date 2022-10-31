import 'virtual-table-component'
import './copyconflicts'
import './copyprogress'
import './extendedrename'
import { copyItems } from '../copy'
import { TableItem, VirtualTable, Column as TableColumn } from 'virtual-table-component'
import { ExtendedRename, extendedRename } from '../extendedrename'
import { compose } from '../functional'
import {
    ActionType, ColumnsType, CopyFiles, EngineType, GetActionTextResult, GetFilePathResult,
    GetItemResult, IOError, IOErrorResult, ItemType, request
} from '../requests'
import { addRemotes } from '../remotes'
import { DialogBox, Result } from 'web-dialog-box'
import { CopyProgress, CopyProgressDialog } from './copyprogress'
import { combineLatest, filter, fromEvent, map, Subject } from 'rxjs'

var latestRequest = 0

export type Version = {
    major: number
    minor: number
    patch: number
    build: number
}

interface FolderColumn extends TableColumn<FolderItem> {
    column: string
    type: ColumnsType
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
    newName?:     string
}

type EnhancedInfoType = {
    requestId:     number
    enhancedItems: FolderItem[]
}

type EnhancedInfo = {
    Case:  "EnhancedInfo",
    Fields: Array<EnhancedInfoType>
}

type GetItemsFinished = {
    Case: "GetItemsFinished"
}

type CopyProgressType = {
    Case:   "CopyProgress",
    Fields: Array<CopyProgress>
}

type FolderEvent = 
    | EnhancedInfo
    | GetItemsFinished
    | CopyProgressType

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

export function getSelectedItemsOverview(items: FolderItem[]) {
    const dirs = items.filter(n => n.isDirectory).length
    const files = items.filter(n => !n.isDirectory).length
    return [dirs, files]
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
        this.copyProgress = document.getElementById('copy-progress') as CopyProgressDialog

        this.table.renderRow = (item, tr) => {
            tr.onmousedown = evt => {
                if (evt.ctrlKey)
                    setTimeout(() => {
                        const pos = this.table.getPosition()
                        this.table.items[pos].isSelected = !this.table.items[pos].isSelected
                        this.extendedRename?.selectionChanged(this.table.items) 
                        this.table.refresh()
                    })
            }
            switch (this.engine) {
                case EngineType.Root:
                    if (!item.isMounted)
                        tr.style.opacity = "0.5"
                    break
                case EngineType.Directory:
                    tr.draggable = true
                    tr.ondragstart = evt => this.onDragStart(evt)
                    tr.ondrag = evt => this.onDrag(evt)
                    tr.ondragend = () => this.onDragEnd()
                    if (item.isHidden)
                        tr.style.opacity = "0.5"
                    break
            }
        }

        const toFolderEvent = (event: MessageEvent) => {
            return JSON.parse(event.data) as FolderEvent
        }

        this.source = new EventSource(this.id == "folderLeft" ? "commander/sseLeft" : "commander/sseRight")
        let folderEvents = fromEvent<MessageEvent>(this.source, 'message')
            .pipe(map(toFolderEvent))
                
        let getItemsFinishedEvents = folderEvents
            .pipe(filter(n => n.Case == "GetItemsFinished"))
        let enhancedInfoEvents = folderEvents
            .pipe(filter(n => n.Case == "EnhancedInfo"))
            .pipe(map(n => (n as EnhancedInfo).Fields[0]))
        let copyProgressEvents = folderEvents
            .pipe(filter(n => n.Case == "CopyProgress"))
            .pipe(map(n => (n as CopyProgressType).Fields[0]))

        getItemsFinishedEvents.subscribe(() => this.disableSorting(false))
        copyProgressEvents.subscribe(this.copyProgress?.setValue.bind(this.copyProgress))

        combineLatest([enhancedInfoEvents, this.itemsChanged])
            .pipe(filter(([info, requestId]) => info.requestId == requestId && requestId == this.requestId))
            .pipe(map(([info, ]) => info))
            .subscribe(evt => {
                evt.enhancedItems.forEach(n => {
                    if (n.exifTime) 
                        this.items[n.index!].exifTime = n.exifTime
                    if (n.version) 
                        this.items[n.index!].version = n.version
                })            
                this.table.refresh()
            })

        this.changePath() 
        const lastPath = localStorage.getItem(`${this.folderId}-lastPath`)
        setTimeout(() => this.changePath(lastPath))
    }

    connectedCallback() {
        this.table.addEventListener("columnclick", evt => {
            const detail = (evt as CustomEvent).detail
            const sortfn = this.getSortFunction(detail.column, detail.subItem)
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
                    this.extendedRename?.selectionChanged(this.table.items)
                    this.selectNone()
                    break
                case 35: // end
                    if (evt.shiftKey) {
                        const pos = this.table.getPosition()
                        this.table.items.forEach((item, i) => item.isSelected = item.selectable && i >= pos)                     
                        this.extendedRename?.selectionChanged(this.table.items)
                        this.table.refresh()
                    }
                    break
                case 36: // home
                    if (evt.shiftKey) {
                        const pos = this.table.getPosition()
                        this.table.items.forEach((item, i) => item.isSelected = item.selectable && i <= pos)                     
                        this.extendedRename?.selectionChanged(this.table.items)
                        this.table.refresh()
                    }
                    break
                case 45: { // Ins
                    const pos = this.table.getPosition()
                    this.table.items[pos].isSelected = this.table.items[pos].selectable && !this.table.items[pos].isSelected 
                    this.extendedRename?.selectionChanged(this.table.items)
                    this.table.setPosition(pos + 1)
                    break
                }
            }
        })
        this.table.addEventListener("enter", async evt => {
            try {
                let currentItem = this.table.items[(evt as CustomEvent).detail.currentItem]
                if (currentItem.itemType == ItemType.AddRemote) {
                    await addRemotes(this.folderId)
                    this.reloadItems()
                    this.table.setFocus()
                }
                else if (currentItem.isDirectory)
                    await this.changePath(this.path, currentItem)
                else if (await this.extendedRename?.rename(this.table, this.getCurrentPath(), () => this.setFocus(), e => this.checkResult(e)))
                    this.reloadItems()
                else {
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
                }
            } catch (exn) {
                console.log("exn", exn)
            }
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
            this.extendedRename = null
            this.engine = result.engine
            this.sortFunction = null
            this.enhancedIndexes = []
            this.table.setColumns(result.columns!.map((m, i) => {
                const n = m as any as FolderColumn 
                switch (n.type) {
                    case ColumnsType.Name:
                    case ColumnsType.NameExtension:
                        n.isSortable = true
                        n.subItem = n.type == ColumnsType.NameExtension
                            ? { name: "Ext." }
                            : undefined
                            n.render = renderIcon
                        break
                    case ColumnsType.Size:
                        n.isRightAligned = true
                        n.isSortable = true
                        n.render = (td, item) => {
                            td.innerHTML = formatSize((item as any)[n.column])
                            td.classList.add("rightAligned")
                        }
                        break
                    case ColumnsType.Time:
                        this.enhancedIndexes = this.enhancedIndexes.concat([i])
                        n.isSortable = true
                        n.render = (td, item) => {
                            td.innerHTML = formatDateTime(item.exifTime || (item as any)[n.column]) 
                            if (item.exifTime)
                                td.classList.add("exif")
                        }
                        break
                    case ColumnsType.Version:
                        this.enhancedIndexes = this.enhancedIndexes.concat([i])
                        n.isSortable = true
                        n.render = (td, item) => td.innerHTML = this.formatVersion(item.version) 
                        break
                    default:
                        n.render = (td, item) => td.innerHTML= (item as any)[n.column]
                        break
                }
                return n
            }), `${this.folderId}-${result.engine}`)
            this.sortFunction = this.getSortFunction(0, false)
        }

        if (!result.withEnhanced)
            this.disableSorting(false)

        this.items = result.items
        this.itemsChanged.next(requestId)

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

        // TODO mark size differences in conflicts yellow
        // TODO when newer in conflicts and green marked, select yes
        // TODO Drag n drop: drag to external copy/move
        // TODO Copy paste?
        // TODO Copy/Move Conflicts: Version
        // TODO Windows Title Icon is blurry
        // TODO Adapt Yaru theme
        // TODO when Time sorting, then sort after exif or disable time sort
        // TODO GetFileItems native faster with pinvoke
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
        this.extendedRename?.selectionChanged(this.table.items)
        this.table.refresh()
    }

    selectNone() {
        this.table.items.forEach(n => n.isSelected = false)
        this.extendedRename?.selectionChanged(this.table.items)
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
        let onDrop = async () => {
            function *getItems() {
                if (evt.dataTransfer?.files)
                    for (let i = 0; i < evt.dataTransfer.files.length; i++)
                        yield evt.dataTransfer!.files.item(i)!
            }
            let input = [...getItems()].map(n => (n as any).path)
            let copyFiles = await request<CopyFiles>("preparefilecopy", input)
                    
            await copyItems(this.id, e => this.checkResult(e), false,
                this.id != "folderLeft",
                EngineType.Directory,
                this.engine,
                copyFiles.basePath,
                this.path,
                copyFiles.items
            )

            this.setFocus()
            this.reloadItems()
        }

        this.folderRoot.classList.remove("isDragging")
        if (evt.dataTransfer?.getData("internalCopy") == "true") {
            evt.preventDefault()
            if (this.dropEffect == "move")
                this.dispatchEvent(new CustomEvent('dragAndDropMove'))
            else
                this.dispatchEvent(new CustomEvent('dragAndDropCopy'))
        }
        else 
            onDrop()
    }

    async switchExtendedRename() {
        this.extendedRename = await extendedRename(this.extendedRename, this.folderId, this.engine, this.table, () => this.setFocus())
    }

    async deleteSelectedItems() {
        var items = this.getSelectedItems()
        const [dirs, files] = getSelectedItemsOverview(items)
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
        const [dirs, files] = getSelectedItemsOverview(items)
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
                engine:   this.engine,
                path:     this.getCurrentPath(),
                name:     item.name,
                newName:  res.input
            })
            this.checkResult(ioResult.error) 
        }
    }
    
    async createFolder() {
        var items = this.getSelectedItems()
        const [dirs, files] = getSelectedItemsOverview(items)
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

        await copyItems(this.id, e => this.checkResult(e), move ?? false,
            fromLeft,
            this.engine,
            other.engine,
            this.path,
            other.path,
            items
        )

        this.setFocus()
        other.reloadItems()
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

    private getSortFunction(index: number, isSubItem: boolean): (([a, b]: FolderItem[]) => number) | null {
        const columns = this.table.getColumns() as FolderColumn[]
        const column = columns[index].column
        switch (columns[index].type) {
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

    private source: EventSource
    private table: VirtualTable<FolderItem>
    private extendedRename: ExtendedRename | null = null
    private folderRoot: HTMLElement
    private folderId = ""
    private itemsChanged = new Subject<number>()
    private copyProgress: CopyProgressDialog
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


