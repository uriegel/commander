import { Column, VirtualTable } from "virtual-table-component"
import { ExternalsEngine, EXTERNALS_PATH } from "./externals"
import { FileEngine } from "./file"
import { RootEngine, ROOT_PATH } from "./root"

export type ItemResult = {
    items: FolderItem[]
    path: string
}

export interface FolderItem {
    name: string
    isDirectory: boolean
}

export type PathResult = {
    path?: string 
    recentFolder?: string
}

export type Engine = {
    currentPath: string
    isSuitable: (path: string|null|undefined)=>boolean
    getItems: (path?: string|null, showHiddenItems?: boolean)=>Promise<ItemResult>
    getItemPath: (item: FolderItem)=>string
    getColumns(): Column[]
    getPath: (item: FolderItem, refresh: ()=>void)=>Promise<PathResult>
    renderRow: (item: FolderItem, tr: HTMLTableRowElement)=>void
    saveWidths: (widths: number[])=>void
    getSortFunction: (column: number, isSubItem: boolean)=>(([a, b]: FolderItem[]) => number) | null  
    disableSorting: (table: VirtualTable, disable: boolean)=>void
    addExtendedInfos: (path: string|undefined|null, items: FolderItem[], refresh: ()=>void)=>Promise<void>
}

export function getEngine(folderId: string, path: string|null|undefined, current: Engine): {engine: Engine, changed: boolean} {
    if (current.isSuitable(path))
        return { engine: current, changed: false } 
    else if (!path || path == ROOT_PATH)         
        return { engine: new RootEngine(folderId), changed: true } 
    else if (path == EXTERNALS_PATH)         
        return { engine: new ExternalsEngine(folderId), changed: true } 
    else
        return { engine: new FileEngine(folderId), changed: true }
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

export const getExtension = (path: string) => {
    let index = path.lastIndexOf(".")
    return index > 0 ? path.substr(index) : ""
}

const dateFormat = Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

const timeFormat = Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
})

export const formatDateTime = (unixDate: number) => {
    if (!unixDate)
        return ''

    return dateFormat.format(unixDate) + " " + timeFormat.format(unixDate)  
}
