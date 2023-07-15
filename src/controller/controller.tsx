import { SpecialKeys, TableColumns } from "virtual-table-react"
import { DialogHandle } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import { getFileSystemController } from "./filesystem"
import { getRemotesController, REMOTES } from "./remotes"
import { GetExtendedItemsResult, GetItemResult, IOError, Version } from "../requests/requests"
import { getRootController, ROOT } from "./root"
import { getRemoteController } from "./remote"
import { FAVORITES, getFavoritesController } from "./favorites"

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
    FileSystem,
    Remotes,
    Remote,
    Favorites
}

export type SortFunction = (a: FolderViewItem, b: FolderViewItem) => number

export interface onEnterResult {
    processed: boolean
    pathToSet?: string
    latestPath?: string
    mount?: boolean
}

export interface EnterData {
    path: string,
    otherPath?: string
    item: FolderViewItem, 
    keys: SpecialKeys, 
    dialog?: DialogHandle|null, 
    refresh?: ()=>void, 
    selectedItems?: FolderViewItem[]
    items?: FolderViewItem[]
}

export interface Controller {
    type: ControllerType
    id: string
    getColumns: ()=>TableColumns<FolderViewItem>
    getItems: (path: string, showHidden: boolean, sortIndex: number, sortDescending: boolean, mount?: boolean) => Promise<GetItemResult>
    getExtendedItems: (path: string, items: FolderViewItem[]) => Promise<GetExtendedItemsResult>
    setExtendedItems: (items: FolderViewItem[], extended: GetExtendedItemsResult)=>FolderViewItem[]
    onEnter: (data: EnterData) => Promise<onEnterResult>
    sort: (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => FolderViewItem[]
    itemsSelectable: boolean
    appendPath: (path: string, subPath: string) => string,
    rename: (path: string, item: FolderViewItem, dialog: DialogHandle | null) => Promise<IOError | null>
    extendedRename: (controller: Controller, dialog: DialogHandle|null) => Promise<Controller|null>
    createFolder: (path: string, item: FolderViewItem, dialog: DialogHandle|null) => Promise<IOError | null>
    deleteItems: (path: string, items: FolderViewItem[], dialog: DialogHandle|null) => Promise<IOError | null>
    onSelectionChanged: (items: FolderViewItem[]) => void 
}

export interface ControllerResult {
    changed: boolean
    controller: Controller
}

export const getViewerPath = (path: string) => 
    path.startsWith("remote")
    ? `http://${path.stringBetween("/", "/")}:8080/${path.substringAfter("/").substringAfter("/")}`
    : `http://localhost:20000/commander/file?path=${path}`

export const checkController = (path: string, controller: Controller|null):ControllerResult => 
    path == ROOT
    ? getRootController(controller)
    : path == REMOTES  
    ? getRemotesController(controller)
    : path.startsWith("remote/")        
    ? getRemoteController(controller)
    : path == FAVORITES  
    ? getFavoritesController(controller)
    : getFileSystemController(controller)

export const createEmptyController = (): Controller => ({
    type: ControllerType.Empty,
    id: "empty",
    getColumns: () => ({
        columns: [],
        renderRow: p => []
    }),
    getItems: async () => ({ items: [], path: "", dirCount: 0, fileCount: 0 }),
    getExtendedItems: async () => ({ path: "", exifTimes: [], versions: []}),
    setExtendedItems: items=>items,
    onEnter: async () => ({ processed: true }),
    sort: (items: FolderViewItem[]) => items,
    itemsSelectable: false,
    appendPath: () => "",
    rename: async () => null,
    extendedRename: async () => null,
    createFolder: async () => null,
    deleteItems: async () => null,
    onSelectionChanged: () => {}
})

export const addParent = (items: FolderViewItem[]) => 
    [{ name: "..", index: 0, isParent: true, isDirectory: true } as FolderViewItem]
        .concat(items)

export const formatSize = (num?: number) => {
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

export const sortItems = (folderItemArray: FolderViewItem[], sortFunction?: SortFunction, sortDirs?: boolean) => {
    const unsortedDirs = folderItemArray.filter(n => n.isDirectory || n.isParent)
    const dirs = sortDirs ? unsortedDirs.sort((a, b) => a.name.localeCompare(b.name)) : unsortedDirs
    let files = folderItemArray.filter(n => !n.isDirectory) 
    files = sortFunction ? files.sort(sortFunction) : files
    return dirs.concat(files)
}

export const excludeParent = (items: FolderViewItem[]) => 
    items.filter(n => !n.isParent)

interface focusable {
    setFocus: ()=>void
}

export const checkResult = async (dialog: DialogHandle|null|undefined, activeFolderView: focusable|null, error?: IOError | null) => {
    if (error) {
        const text = error == IOError.AccessDenied
                    ? "Zugriff verweigert"
                    : error == IOError.DeleteToTrashNotPossible
                    ? "Löschen nicht möglich"
                    : error == IOError.AlreadyExists
                    ? "Das Element existiert bereits"
                    : error == IOError.FileNotFound
                    ? "Das Element ist nicht vorhanden"
                    : "Die Aktion konnte nicht ausgeführt werden"
        await dialog?.show({
            text,
            btnOk: true
        })
        activeFolderView?.setFocus()
        return false
    } else
        return true
}
