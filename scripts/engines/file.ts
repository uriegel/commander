import { VirtualTable } from "virtual-table-component"
import { Platform } from "../platforms/platforms"
import { Engine, EngineId, formatDateTime, formatSize, getExtension, ItemResult, PathResult } from "./engines"
import { ROOT_PATH } from "./root"
import { dialog } from "../commander"
import { Folder, FolderItem } from "../components/folder"
import { Result } from "web-dialog-box"
import { ExtendedInfo } from "../components/extendedrename"
const fspath = window.require('path')
const { getFiles, getExifDate } = window.require('rust-addon')

export interface FileItem extends FolderItem {
    isHidden?: boolean
    size: number
    exifTime?: number
    time: number
}

export enum ItemsType {
    Directory,
    File,
    Both
}

export type FileError = {
    description: string
    code: FileErrorType
}

export enum FileErrorType {
    Unknown = 1,
    AccessDenied = 2,
    FileExists = 3,
    FileNotFound = 4,
    TrashNotPossible = 5
}

export function getItemsTypes(folderItem: FolderItem): ItemsType; 
export function getItemsTypes(folderItems: FolderItem[]): ItemsType; 
export function getItemsTypes(folderItems: FolderItem[] | FolderItem): ItemsType {
    const items = Array.isArray(folderItems) ? folderItems : [ folderItems ]
    const types = items
        .map(n => n.isDirectory)
        .filter((item, index, resultList) => resultList
            .findIndex(n => n == item) == index)
    return types.length == 1
    ? types[0] ? ItemsType.Directory : ItemsType.File
    : ItemsType.Both
}

export class FileEngine implements Engine {

    constructor(public id: EngineId, folderId: string) {
        this.folderId = folderId
    }

    get currentPath() { return this._currentPath }
    protected set currentPath(value: string) { this._currentPath = value }
    private _currentPath = ""

    isSuitable(path: string|null|undefined, extendedRename?: ExtendedInfo) { return Platform.isFileEnginePath(path) && !extendedRename }
    
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
                td.innerHTML = formatDateTime((item as FileItem).exifTime || (item as FileItem).time)
                if ((item as FileItem).exifTime)
                    td.classList.add("exif")
            }
        }, {
            name: "Größe",
            isSortable: true,
            sortIndex: 3,
            isRightAligned: true,
            render: (td, item) => {
                td.innerHTML = formatSize((item as FileItem).size)
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

    disableSorting(table: VirtualTable<FolderItem>, disable: boolean) {
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

    async renameItem(item: FolderItem, folder: Folder) {
        try {
            // if (activeFolder.isExtendedRename) {
            //     activeFolder.doExtendedRename()
            //     return
            // }
                
            const itemsType = getItemsTypes(item)
            const text = itemsType == ItemsType.File
                ? "Datei umbenennen"
                : "Ordner umbenennen"
            
            const getInputRange = () => {
                const pos = item.name.lastIndexOf(".")
                if (pos == -1)
                    return [0, item.name.length]
                else
                    return [0, pos]
            }
    
            const res = await dialog.show({
                text,
                inputText: item.name,
                inputSelectRange: getInputRange(),
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })    
            folder.setFocus()
            if (res.result == Result.Ok && res.input) {
                await this.rename(item.name, res.input)
                folder.reloadItems(true)
            }
        } catch (e: any) {
            const fileError = e as FileError
            const text = fileError.code == FileErrorType.AccessDenied
                    ? "Zugriff verweigert"
                    : "Die Aktion konnte nicht ausgeführt werden"
            setTimeout(async () => {
                await dialog.show({
                    text,
                    btnOk: true
                })
                folder.setFocus()        
            },
            500)
        }
    }

    async deleteItems(items: FolderItem[], folder: Folder) {
        try {
            const itemsType = getItemsTypes(items)
            const text = itemsType == ItemsType.File 
                ? items.length == 1 
                    ? "Möchtest Du die Datei löschen?"
                    : "Möchtest Du die Dateien löschen?"
                : itemsType == ItemsType.Directory
                ?  items.length == 1 
                    ? "Möchtest Du den Ordner löschen?"
                    : "Möchtest Du die Ordner löschen?"
                : "Möchtest Du die Einträge löschen?"
            const res = await dialog.show({
                text,
                btnOk: true,
                btnCancel: true
            })    
            folder.setFocus()
            if (res.result == Result.Ok) {
                await this.delete(items)
                folder.reloadItems(true)
            }
        } catch (e: any) {
            const fileError = e as FileError
            const text = fileError.code == FileErrorType.AccessDenied
                    ? "Zugriff verweigert"
                    : fileError.code == FileErrorType.TrashNotPossible
                    ? "Löschen in den Papierkorb nicht möglich"
                    : "Die Aktion konnte nicht ausgeführt werden"
            setTimeout(async () => {
                await dialog.show({
                    text,
                    btnOk: true
                })
                folder.setFocus()        
            },
            500)
        }
    }

    async createFolder(suggestedName: string, folder: Folder) {
        try {
            const res = await dialog.show({
                text: "Neuen Ordner anlegen",
                inputText: suggestedName,
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })
            folder.setFocus()
            if (res.result == Result.Ok && res.input) {
                await this.processCreateFolder(res.input)
                folder.reloadItems(true)
            }
        } catch (e: any) {
            const fileError = e as FileError
            const text = fileError.code == FileErrorType.FileExists
                ? "Die angegebene Datei existiert bereits"
                : fileError.code == FileErrorType.AccessDenied
                    ? "Zugriff verweigert"
                    : "Die Aktion konnte nicht ausgeführt werden"
            setTimeout(async () => {
                await dialog.show({
                    text,
                    btnOk: true
                })
                folder.setFocus()        
            },
            500)
        }
    }

    onEnter(name: string) { 
        Platform.onEnter(name, this.currentPath)
    }

    hasExtendedRename() { 
        return true
    }
    
    protected getParentDir(path: string): PathResult {
        let pos = path.lastIndexOf(Platform.pathDelimiter)
        let parent = pos ? path.substring(0, pos) : Platform.pathDelimiter
        return { path: parent, recentFolder: path.substring(pos + 1) }
    }

    protected async addAdditionalInfo(item: FileItem, name: string, path: string) { 
        await Platform.addAdditionalInfo(item, name, path) 
    }

    protected async rename(item: string, newName: string) {
        await Platform.renameFile(fspath.join(this.currentPath, item), fspath.join(this.currentPath, newName))
    }

    protected async delete(items: FolderItem[]) {
        await Platform.deleteFiles(items.map(n => fspath.join(this.currentPath, n.name)))
    }

    protected async processCreateFolder(name: string) {
        await Platform.createFolder(fspath.join(this.currentPath, name))
    }
    
    private async addExtendedInfo(item: FileItem, path: string) {
        var name = item.name.toLocaleLowerCase();
        if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))
            item.exifTime = await getExifDate(fspath.join(path, item.name))
        await this.addAdditionalInfo(item, name, path)
    }

    private folderId: string;
}