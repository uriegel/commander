import { VirtualTable } from "virtual-table-component"
import { Platform } from "../platforms/platforms"
import { Engine, FolderItem, formatDateTime, formatSize, getExtension, ItemResult, PathResult } from "./engines"
import { ROOT_PATH } from "./root"
const fspath = window.require('path')
const { getFiles, getExifDate } = window.require('rust-addon')

export interface FileItem extends FolderItem {
    isHidden?: boolean
    size: number
    exifTime?: number
    time: number
}

export class FileEngine implements Engine {

    constructor(folderId: string) {
        this.folderId = folderId
    }

    get currentPath() { return this._currentPath }
    protected set currentPath(value: string) { this._currentPath = value }
    private _currentPath = ""

    isSuitable(path: string|null|undefined) { return Platform.isFileEnginePath(path) }
    
    async getItems(path: string|null = "", showHiddenItems?: boolean) {
        path = fspath.normalize(path).replace(":.", ":\\")
        var response = (getFiles(path) as FileItem[])
            .filter(n => showHiddenItems ? true : !n.isHidden)

        let items = [{
                name: "..",
                isNotSelectable: true,
                isDirectory: true,
                size: 0,
                time: 0
            } as FileItem ]
            .concat(response.filter(n => n.isDirectory))
            .concat(response.filter(n => !n.isDirectory))
        if (items && items.length)
            this.currentPath = path!
        return { items, path } as ItemResult
    }

    getColumns() { 
        //const widthstr = localStorage.getItem(`${folderId}-${(extendedRename ? "extended-" : "")}directory-widths`)
        const widthstr = localStorage.getItem(`${this.folderId}-directory-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = Platform.adaptDirectoryColumns([{
            name: "Name",
            isSortable: true,
            sortIndex: 1,
            subItem: {
                name: "Ext."
            },            
            render: (td, item) => {
                const selector = item.name == ".." 
                    ? '#parentIcon' 
                    : item.isDirectory
                        ? '#folderIcon'
                        : '#fileIcon'
                if (selector != '#fileIcon') {
                    var t = document.querySelector(selector) as HTMLTemplateElement
                    td.appendChild(document.importNode(t.content, true))
                } else {
                    const img = document.createElement("img")
                    const ext = getExtension(item.name)
                    // TODO: Windows
                    //if (ext) {
                        // if (ext == "exe") {
                        //    img.src = `icon://${}`
                        // } else 
                        img.src = `icon://${ext}`
                        img.classList.add("image")
                        td.appendChild(img)
                    // } else {
                    //     var t = document.querySelector(selector)
                    //     td.appendChild(document.importNode(t.content, true))
                    // }
                }

                const span = document.createElement('span')
                span.innerHTML = item.name
                td.appendChild(span)
            }            
        }, {
            name: "Datum",
            isSortable: true,
            sortIndex: 2,
            render: (td, item) => {
                td.innerHTML = formatDateTime(item.exifTime || item.time)
                if (item.exifTime)
                    td.classList.add("exif")
            }
        }, {
            name: "Größe",
            isSortable: true,
            sortIndex: 3,
            isRightAligned: true,
            render: (td, item) => {
                td.innerHTML = formatSize(item.size)
                td.classList.add("rightAligned")
            }
        }])
        // if (extendedRename) 
        //     columns.splice(1, 0, { name: "Neuer Name", render: (td, item) => { td.innerHTML = item.newName || ""}})
        if (widths)
            columns = columns.map((n, i)=> ({ ...n, width: widths[i]}))
        return columns
    }

    getItemPath(item: FolderItem) { return fspath.join(this.currentPath, item.name) }
    
    async getPath(item: FolderItem, _: ()=>void) {
        return item.isDirectory 
        ? item.name != ".."
            ? { path: this.currentPath != "\\" ? this.currentPath + Platform.pathDelimiter + item.name : this.currentPath + item.name }
            : Platform.parentIsRoot(this.currentPath)  
                ? { path: ROOT_PATH }
                : this.getParentDir(this.currentPath) 
        : { }
    }

    renderRow(item: FolderItem, tr: HTMLTableRowElement) {
        tr.setAttribute("draggable", "true")
        if ((item as FileItem).isHidden)
            tr.style.opacity = "0.5"
    }

 //   saveWidths(widths:number[]) { localStorage.setItem(`${this.folderId}-${(extendedRename ? "extended-" : "")}directory-widths`, JSON.stringify(widths)) }
    saveWidths(widths:number[]) { localStorage.setItem(`${this.folderId}-directory-widths`, JSON.stringify(widths)) }

    getSortFunction(column: number, isSubItem: boolean): (([a, b]: FolderItem[]) => number) | null {
        switch (column) {
            case 1:
                return isSubItem == false 
                    ? ([a, b]: FolderItem[]) => a.name.localeCompare(b.name) 
                    : ([a, b]: FolderItem[]) => getExtension(a.name).localeCompare(getExtension(b.name))
            case 2: 
                return ([a, b]: FolderItem[]) => ((a as any as FileItem).exifTime ? (a as any as FileItem).exifTime! : (a as any as FileItem).time 
                    - (b && (b as any as FileItem).exifTime ? (b as any as FileItem).exifTime! : (b as any as FileItem).time))
            case 3: 
                return ([a, b]: FolderItem[]) => (a as any as FileItem).size - (b as any as FileItem).size
            default:
                return this.getAdditionalSortFunction(column, isSubItem)
        } 
    }

    disableSorting(table: VirtualTable, disable: boolean) {
        table.disableSorting(1, disable)
        Platform.disableSorting(table, disable)
    }

    protected getAdditionalSortFunction(column: number, isSubItem: boolean): (([a, b]: FolderItem[]) => number) | null {
        return Platform.getAdditionalSortFunction(column, isSubItem)
    }

    async addExtendedInfos(path: string|undefined|null, items: FolderItem[], refresh: ()=>void) {
        for (let i = 0; i < items.length; i++ ) {
            const n = items[i]
            await this.addExtendedInfo(n as FileItem, path!)
            if (i != 0 && i % 50 == 0)
                refresh()
        }
        refresh()

    }

    protected getParentDir(path: string): PathResult {
        let pos = path.lastIndexOf(Platform.pathDelimiter)
        let parent = pos ? path.substring(0, pos) : Platform.pathDelimiter
        return { path: parent, recentFolder: path.substring(pos + 1) }
    }

    protected async addAdditionalInfo(item: FileItem, name: string, path: string) { 
        await Platform.addAdditionalInfo(item, name, path) 
    }

    private async addExtendedInfo(item: FileItem, path: string) {
        var name = item.name.toLocaleLowerCase();
        if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))
            item.exifTime = await getExifDate(fspath.join(path, item.name))
        await this.addAdditionalInfo(item, name, path)
    }

    private folderId: string;
}