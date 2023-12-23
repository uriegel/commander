import { SpecialKeys, TableColumns } from "virtual-table-react"
import { DialogHandle } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import { getFileSystemController } from "./filesystem"
import { getRemotesController, REMOTES } from "./remotes"
import { GetExtendedItemsResult, GetItemsResult, IOError, Version } from "../requests/requests"
import { getRootController, ROOT } from "./root"
import { getRemoteController } from "./remote"
import { FAVORITES, getFavoritesController } from "./favorites"
import { SERVICES, getServicesController } from "./services"
import { Platform, getPlatform } from "../globals"
import { AsyncResult, ErrorType, Nothing, Ok, nothing } from "functional-extensions"

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
    Favorites,
    Services
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
    getItems: (path: string, showHidden: boolean, sortIndex: number, sortDescending: boolean, mount: boolean, dialog: DialogHandle) => Promise<GetItemsResult>
    getExtendedItems: (id: string, path: string, items: FolderViewItem[]) => Promise<GetExtendedItemsResult>
    setExtendedItems: (items: FolderViewItem[], extended: GetExtendedItemsResult) => FolderViewItem[]
    cancelExtendedItems: (id: string)=>Promise<void>
    onEnter: (data: EnterData) => Promise<onEnterResult>
    sort: (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => FolderViewItem[]
    itemsSelectable: boolean
    appendPath: (path: string, subPath: string) => string,
    rename: (path: string, item: FolderViewItem, dialog: DialogHandle) => AsyncResult<Nothing, ErrorType>
    extendedRename: (controller: Controller, dialog: DialogHandle | null) => Promise<Controller | null>
    renameAsCopy: (path: string, item: FolderViewItem, dialog: DialogHandle | null) => Promise<IOError | null>
    createFolder: (path: string, item: FolderViewItem, dialog: DialogHandle) => AsyncResult<Nothing, ErrorType>
    deleteItems: (path: string, items: FolderViewItem[], dialog: DialogHandle) => AsyncResult<Nothing, ErrorType>
    onSelectionChanged: (items: FolderViewItem[]) => void 
    cleanUp: () => void
}

export interface ControllerResult {
    changed: boolean
    controller: Controller
}

export const getViewerPath = (path: string) => 
    path.startsWith("remote")
    ? `http://${path.stringBetween("/", "/")}:8080/remote/${path.substringAfter("/").substringAfter("/")}`
    : `http://localhost:20000/commander/file?path=${path}`

export const checkController = (path: string, controller: Controller | null): ControllerResult => 
    checkNewController(
        path == ROOT
        ? getRootController(controller)
        : path == REMOTES  
        ? getRemotesController(controller)
        : path.startsWith("remote/")        
        ? getRemoteController(controller)
        : path == FAVORITES  
        ? getFavoritesController(controller)
        : path == SERVICES && getPlatform() == Platform.Windows
        ? getServicesController(controller)
        : getFileSystemController(controller), controller)

export const createEmptyController = (): Controller => ({
    type: ControllerType.Empty,
    id: "empty",
    getColumns: () => ({
        columns: [],
        renderRow: () => []
    }),
    getItems: async () => ({dirCount: 0, fileCount: 0, items: [], path: ""}),
    getExtendedItems: async () => ({ path: "", exifTimes: [], versions: [] }),
    setExtendedItems: items => items,
    cancelExtendedItems: async () => { },
    onEnter: async () => ({ processed: true }),
    sort: (items: FolderViewItem[]) => items,
    itemsSelectable: false,
    appendPath: () => "",
    rename: () => AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)),
    extendedRename: async () => null,
    renameAsCopy: async () => null,
    createFolder: () => AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)),
    deleteItems: () => AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)),
    onSelectionChanged: () => { },
    cleanUp: () => { }
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
        const sizePart = sizeStr
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

export const checkResult = async (dialog: DialogHandle|null|undefined, activeFolderView?: focusable|null, error?: IOError | null) => {
    if (error) {
        const text = error === IOError.AccessDenied
                    ? "Zugriff verweigert"
                    : error === IOError.DeleteToTrashNotPossible
                    ? "Löschen nicht möglich"
                    : error === IOError.AlreadyExists
                    ? "Das Element existiert bereits"
                    : error === IOError.FileNotFound
                    ? "Das Element ist nicht vorhanden"
                    : "Die Aktion konnte nicht ausgeführt werden"
        dialog?.close()
        await delay(500)
        await dialog?.show({
            text,
            btnOk: true
        })
        activeFolderView?.setFocus()
        return false
    } else
        return true
}

export const showError = async (error: ErrorType, dialog: DialogHandle, activeFolderView?: focusable | null) => {

    const getRequestError = (ioError: IOError) => 
        ioError === IOError.AccessDenied
            ? "Zugriff verweigert"
            : ioError === IOError.DeleteToTrashNotPossible
            ? "Löschen nicht möglich"
            : ioError === IOError.AlreadyExists
            ? "Das Element existiert bereits"
            : ioError === IOError.FileNotFound
            ? "Das Element ist nicht vorhanden"
            : "Die Aktion konnte nicht ausgeführt werden"

    const getClientError = (error: ErrorType) => 
        `${error.status - 1000} ${error.statusText}`

    const getServerError = (error: ErrorType) => 
        `${error.status - 2000} ${error.statusText}`

    const text = error.status < 1000
        ? getRequestError(error.status as IOError)
        : error.status < 2000
        ? getClientError(error)
        : getServerError(error)
    
    if (error.status !== IOError.Canceled && error.status !== IOError.UacNotStarted) {
        dialog?.close()
        await delay(500)
        await dialog?.show({
            text,
            btnOk: true
        })
        activeFolderView?.setFocus()
    }
}

const checkNewController = (controllerResult: ControllerResult, recentController: Controller | null): ControllerResult => {
    if (controllerResult.changed)
        recentController?.cleanUp()
    return controllerResult
}

const delay = (timeout: number) => new Promise<number>(res => 
    setTimeout(() => res(0), timeout))