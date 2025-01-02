import { SpecialKeys, TableColumns } from "virtual-table-react"
import { DialogHandle } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import { getFileSystemController } from "./filesystem"
import { getRemotesController, REMOTES } from "./remotes"
import { GetExtendedItemsResult, GetItemsResult, IOError, RequestError, Version } from "../requests/requests"
import { getRootController, ROOT } from "./root"
import { getRemoteController } from "./remote"
import { FAVORITES, getFavoritesController } from "./favorites"
import { SERVICES, getServicesController } from "./services"
import { Platform, getPlatform, getPort } from "../globals"
import { ErrorType } from "functional-extensions"
import { DirectoryChangedEvent } from "../requests/events"

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

export interface OnEnterResult {
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
    dialog: DialogHandle, 
    setError: (e: string)=>void
    refresh: ()=>void, 
    selectedItems: FolderViewItem[]
    items: FolderViewItem[]
}

export enum ItemsType {
	Directories,
	Directory,
	Files,
	File,
	All
}

export interface Controller {
    type: ControllerType
    id: string
    getColumns: ()=>TableColumns<FolderViewItem>
    getItems: (id: string, path: string, showHidden: boolean, sortIndex: number, sortDescending: boolean, mount: boolean, dialog: DialogHandle) => Promise<GetItemsResult>
    updateItems: (items: FolderViewItem[], sortIndex: number, sortDescending: boolean, evt: DirectoryChangedEvent)=>FolderViewItem[]|null
    getPath(): string
    getExtendedItems: (id: string, path: string, items: FolderViewItem[]) => Promise<GetExtendedItemsResult>
    setExtendedItems: (items: FolderViewItem[], extended: GetExtendedItemsResult, sortIndex: number, sortDescending: boolean) => FolderViewItem[]
    cancelExtendedItems: (id: string)=>Promise<void>,
    onEnter: (data: EnterData) => Promise<OnEnterResult> 
    sort: (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => FolderViewItem[]
    itemsSelectable: boolean
    appendPath: (path: string, subPath: string) => string,
    rename: (path: string, item: FolderViewItem, dialog: DialogHandle) => Promise<string>
    extendedRename: (controller: Controller, dialog: DialogHandle) => Promise<Controller>
    renameAsCopy: (path: string, item: FolderViewItem, dialog: DialogHandle) => Promise<void>
    createFolder: (path: string, item: FolderViewItem, dialog: DialogHandle) => Promise<string>
    deleteItems: (path: string, items: FolderViewItem[], dialog: DialogHandle) => Promise<void>
    onSelectionChanged: (items: FolderViewItem[]) => void 
    cleanUp: () => void
}

export interface ControllerResult {
    changed: boolean
    controller: Controller
}

export const getViewerPath = (path: string) => 
    path.startsWith("remote")
        ? `http://${path.stringBetween("/", "/")}/getfile/${path.substringAfter("/").substringAfter("/")}`
        : `http://localhost:${getPort()}/getfile?path=${path}`

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
    getItems: () => { throw new RequestError(IOError.Dropped, "") },
    updateItems: () => null,
    getPath: () => "empty",
    getExtendedItems: () => { throw new RequestError(IOError.Dropped, "") },
    setExtendedItems: items => items,
    cancelExtendedItems: async () => { },
    onEnter: async () => ({ processed: true }),
    sort: (items: FolderViewItem[]) => items,
    itemsSelectable: false,
    appendPath: () => "",
    rename: async () => "",
    extendedRename: async () => { throw new RequestError(IOError.NotSupported, "") }, 
    renameAsCopy: async () => {},
    createFolder: async () => "",
    deleteItems: async () => {},
    onSelectionChanged: () => { },
    cleanUp: () => { }
})

export const getItemsType = (items: FolderViewItem[]): ItemsType => {
	const dirs = items.filter(n => n.isDirectory)
	const files = items.filter(n => !n.isDirectory)
	return dirs.length == 0
		? files.length > 1
		? ItemsType.Files
		: ItemsType.File
		: dirs.length == 1
		? files.length != 0
		? ItemsType.All
		: ItemsType.Directory
		: dirs.length > 1
		? files.length != 0
		? ItemsType.All
		: ItemsType.Directories
		: ItemsType.All
}

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

export const sortItems = (folderItemArray: FolderViewItem[], sortFunction?: SortFunction) => {
    const dirs = folderItemArray.filter(n => n.isDirectory || n.isParent).sort((a, b) => a.name.localeCompare(b.name))
    let files = folderItemArray.filter(n => !n.isDirectory) 
    files = sortFunction ? files.sort(sortFunction) : files
    return dirs.concat(files)
}

export const excludeParent = (items: FolderViewItem[]) => 
    items.filter(n => !n.isParent)

export const showError = (error: ErrorType, setError: (error: string)=>void, prefix?: string) => {

    const getRequestError = (ioError: IOError) => 
        ioError === IOError.AccessDenied
            ? "Zugriff verweigert"
            : ioError === IOError.AlreadyExists
            ? "Das Element existiert bereits"
            : ioError === IOError.FileNotFound
            ? "Das Element ist nicht vorhanden"
            : ioError === IOError.DeleteToTrashNotPossible
            ? "Löschen nicht möglich"
            : ioError === IOError.NetNameNotFound
            ? "Der Netzwerkname wurde nicht gefunden"
            : ioError === IOError.PathNotFound
            ? "Der Pfad wurde nicht gefunden"
            : ioError === IOError.NotSupported
            ? "Nicht unterstützt"
            : ioError === IOError.PathTooLong
            ? "Der Pfad ist zu lang"
            : ioError === IOError.WrongCredentials
            ? "Die Zugangsdaten sind falsch"
            : ioError === IOError.NoDiskSpace
            ? "Kein Speicherplatz mehr vorhanden"
            : ioError === IOError.OperationInProgress                                                
            ? "Es ist bereits eine Hintergrundaktion im Gange"
            : ioError === IOError.Cancelled
            ? "Die Aktion wurde abgebrochen"
            : ioError === IOError.ConnectionRefused
            ? "Verbindungsaufbau wurde abgelehnt"
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

    if (error.status !== IOError.Dropped && error.status !== IOError.UacNotStarted) {
        setError((prefix ?? "") + text)
    }
}

const checkNewController = (controllerResult: ControllerResult, recentController: Controller | null): ControllerResult => {
    if (controllerResult.changed)
        recentController?.cleanUp()
    return controllerResult
}

