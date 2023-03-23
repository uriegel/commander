import { SpecialKeys, TableColumns } from "virtual-table-react"
import { DialogHandle } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import { lastIndexOfAny } from "../globals"
import { getFileSystemController } from "./filesystem"
import { GetExtendedItemsResult, GetItemResult, IOError, Version } from "./requests"
import { getRootController, ROOT } from "./root"

const dateFormat = Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

const timeFormat = Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
})

export enum ControllerType {
    Empty,
    Root,
    FileSystem
}

export type SortFunction = (a: FolderViewItem, b: FolderViewItem) => number

export interface onEnterResult {
    processed: boolean
    pathToSet?: string
    latestPath?: string
}

export interface Controller {
    type: ControllerType
    getColumns: ()=>TableColumns<FolderViewItem>
    getItems: (path: string, showHidden: boolean, sortIndex: number, sortDescending: boolean) => Promise<GetItemResult>
    getExtendedItems: (path: string, items: FolderViewItem[]) => Promise<GetExtendedItemsResult>
    setExtendedItems: (items: FolderViewItem[], extended: GetExtendedItemsResult)=>FolderViewItem[]
    onEnter: (path: string, item: FolderViewItem, keys: SpecialKeys) => onEnterResult
    sort: (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => FolderViewItem[]
    itemsSelectable: boolean
    appendPath: (path: string, subPath: string) => string,
    rename: (path: string, item: FolderViewItem, dialog: DialogHandle|null) => Promise<IOError | null>
    createFolder: (path: string, item: FolderViewItem, dialog: DialogHandle|null) => Promise<IOError | null>
    deleteItems: (path: string, items: FolderViewItem[], dialog: DialogHandle|null) => Promise<IOError | null>
}

export interface ControllerResult {
    changed: boolean
    controller: Controller
}

export const checkController = (path: string, controller: Controller|null):ControllerResult => 
    path == ROOT
    ? getRootController(controller)
    : getFileSystemController(controller)

export const createEmptyController = (): Controller => ({
    type: ControllerType.Empty,
    getColumns: () => ({
        columns: [],
        renderRow: p => []
    }),
    getItems: async () => ({ items: [], path: "", dirCount: 0, fileCount: 0 }),
    getExtendedItems: async () => ({ path: "", exifTimes: [], versions: []}),
    setExtendedItems: items=>items,
    onEnter: (i, k) => ({ processed: true }),
    sort: (items: FolderViewItem[]) => items,
    itemsSelectable: false,
    appendPath: () => "",
    rename: async () => null,
    createFolder: async () => null,
    deleteItems: async () => null,
})

export const addParent = (items: FolderViewItem[]) => 
    [{ name: "..", index: 0, isParent: true, isDirectory: true } as FolderViewItem]
        .concat(items)

export const formatSize = (num: number | undefined) => {
    if (!num)
        return ""
    let sizeStr = num.toString()
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
        
export function formatDateTime(dateStr?: string) {
    if (!dateStr || dateStr.startsWith("0001"))
        return ''
    const date = Date.parse(dateStr)
    return dateFormat.format(date) + " " + timeFormat.format(date)  
}

export const formatVersion = (version?: Version) => 
    version ? `${version.major}.${version.minor}.${version.build}.${version.patch}` : ""

export const extractSubPath = (path: string) => 
    path.substring(lastIndexOfAny(path, ["/", "\\"]))

export const sortItems = (folderItemArray: FolderViewItem[], sortFunction: SortFunction|undefined) => {
    const dirs = folderItemArray.filter(n => n.isDirectory || n.isParent)
    let files = folderItemArray.filter(n => !n.isDirectory) 
    files = sortFunction ? files.sort(sortFunction) : files
    return dirs.concat(files)
}

export const getExtension = (path: string) => {
    let index = path.lastIndexOf(".")
    return index > 0 ? path.substring(index) : ""
}

export const excludeParent = (items: FolderViewItem[]) => 
    items.filter(n => !n.isParent)

// export const compareVersion = (a?: Version, b?: Version) =>
//     a && b
//     ? (a.major > b.major
//     ? 1
//     : a.major < b.major
//     ? -1
//     : a.minor > b.minor
//     ? 1
//     : a.minor < b.minor
//     ? -1    
//     : a.patch > b.patch
//     ? 1
//     : a.patch < b.patch
//     ? -1        
//     : a.build > b.build
//     ? 1
//     : a.build < b.build
//     ? -1            
//     : 0)
//     : 0