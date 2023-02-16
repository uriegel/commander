import { SpecialKeys, TableColumns, TableRowItem } from "virtual-table-react"
import IconName, { IconNameType } from "../components/IconName"
import { lastIndexOfAny } from "../globals";
import { getFileSystemController } from "./filesystem";
import { ExtendedItem, FolderItem, GetExtendedItemsResult, Version } from "./requests";
import { getRootController, ROOT } from "./root";

const dateFormat = Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

const timeFormat = Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
})

export interface GetItemResult {
    path: string
    items: TableRowItem[]
}

export enum ControllerType {
    Empty,
    Root,
    FileSystem
}

export type SortFunction = (a: TableRowItem, b: TableRowItem) => number

export interface onEnterResult {
    processed: boolean
    pathToSet?: string
    latestPath?: string
}

export interface Controller {
    type: ControllerType
    getColumns: ()=>TableColumns
    getItems: (path: string, sortIndex: number, sortDescending: boolean) => Promise<GetItemResult>
    getExtendedItems: (path: string, items: TableRowItem[]) => Promise<GetExtendedItemsResult>
    setExtendedItems: (items: TableRowItem[], extended: ExtendedItem[])=>TableRowItem[]
    onEnter: (path: string, item: TableRowItem, keys: SpecialKeys)=>onEnterResult
}

export interface ControllerResult {
    changed: boolean
    controller: Controller
}

export const measureRow = () => (<IconName namePart="Measure g" type={IconNameType.Folder} />)

export const checkController = (path: string, controller: Controller|null):ControllerResult => 
    path == ROOT
    ? getRootController(controller)
    : getFileSystemController(controller)

export const createEmptyController = (): Controller => ({
    type: ControllerType.Empty,
    getColumns: () => ({
        columns: [],
        renderRow: p => [],
        measureRow: () => ""
    }),
    getItems: async () => ({ items: [], path: "" }),
    getExtendedItems: async () => ({ path: "", extendedItems: [] }),
    setExtendedItems: items=>items,
    onEnter: (i, k) => ({ processed: true})
} )

export const makeTableViewItems = (items: TableRowItem[], sortFunc: SortFunction|undefined = undefined, withParent = true) => 
    (withParent
        ? [{ name: "..", index: 0, isParent: true } as TableRowItem]
        : [] as TableRowItem[])
        .concat(sortItems(items as FolderItem[], sortFunc))
        .map((n, i) => ({ ...n, index: i }))
       
export const formatSize = (num: number|undefined) => {
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

const sortItems = (folderItemArray: FolderItem[], sortFunction: SortFunction|undefined) => {
    const dirs = folderItemArray.filter(n => n.isDirectory || n.isParent)
    let files = folderItemArray.filter(n => !n.isDirectory) 
    files = sortFunction ? files.sort(sortFunction) : files
    return dirs.concat(files)
}
            
    