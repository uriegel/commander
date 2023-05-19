import { SpecialKeys } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import { Platform, getPlatform } from "../globals"

export type Nothing = {}

type Result = 
	| Nothing 
    | Exception
    | GetRootResult 
    | GetItemResult 
    | GetExtendedItemsResult
    | IOErrorResult
    | CopyItemsResult

export interface RootItem {
    name:        string
    description: string
    size:        number
    isMounted?:  boolean
    mountPoint?: string
}

export type GetItemResult = {
    items: FolderViewItem[]
    dirCount: number
    fileCount: number
    path:  string
}

export type Version = {
    major: number
    minor: number
    patch: number
    build: number
}

export type GetExtendedItemsResult = {
    exifTimes: (string | null)[]
    versions?: (Version | null)[]
    path: string
}

export enum IOError {
    NoError,
    AccessDenied,
    AlreadyExists,
    FileNotFound,
    DeleteToTrashNotPossible,
    Exn
}

export interface IOErrorResult {
    error?: IOError
}

export type GetRootResult = RootItem[]

type Close = "close"
type GetRoot = "getroot"
type GetFiles = "getfiles"
type GetExtendedItems = "getextendeditems"
type ShowDevTools = "showdevtools"
type ShowFullScreen = "showfullscreen"
type RenameItem = "renameitem"
type CreateFolder = "createfolder"
type DeleteItems = "deleteitems"
type CopyItemsInfo = "copyitemsinfo"
type CopyItems = "copyitems"
type CopyItemsFromRemote = "copyitemsfromremote"
type CopyItemsToRemote = "copyitemstoremote"
type CancelCopy = "cancelCopy"
type GetRemoteFiles = "getremotefiles"
type RenameItems = "renameitems"
type OnEnter= "onenter"

type RequestType = 
	| Close
	| GetRoot
    | GetFiles
    | GetExtendedItems
    | ShowDevTools
    | ShowFullScreen
    | RenameItem
    | CreateFolder
    | DeleteItems
    | CopyItemsInfo
    | CopyItems
    | CopyItemsFromRemote
    | CopyItemsToRemote
    | CancelCopy
    | GetRemoteFiles
    | RenameItems
    | OnEnter
    
type Exception = {
	exception: string
}	

type GetFilesType = {
    path:            string,
    showHiddenItems: boolean,
    mount?:          boolean
}

type GetExtendedItemsType = {
    path: string,
    items: string[]
}

type RenameItemType = {
    path:     string
    name:     string
    newName:  string
}

type RenameItemData = {
    name:     string
    newName:  string
}

type RenameItemsType = {
    path:     string
    items:    RenameItemData[]
}

type OnEnterType = {
    path: string
    keys?: SpecialKeys
}

type CreateFolderType = {
    path:       string
    name:       string
}

type DeleteItemsType = {
    path:       string
    names:      string[]
}

export type CopyItem = {
    name: string
    subPath?: string
    isDirectory?: boolean | undefined
    size: number | undefined
    time: string | undefined
    targetSize?: number | undefined
    targetTime?: string | undefined
}

export interface CopyItemsResult extends IOErrorResult {
    infos?: CopyItem[]
}

type CopyItemsType = {
    path:        string
    targetPath:  string
    items:       CopyItem[]
    move:        boolean
}

type Empty = {
    empty?: string
}

export type RequestInput = 
    | Empty  
    | GetFilesType 
    | GetExtendedItemsType
    | RenameItemType
    | CreateFolderType
    | DeleteItemsType
    | CopyItemsType
    | RenameItemsType
    | OnEnterType
	
export async function request<T extends Result>(method: RequestType, input?: RequestInput) {
 
    const msg = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {})
    }

    const response = await fetch(`http://localhost:20000/commander/${method}`, msg) 
    const res = await response.json() as T
    if ((res as Exception).exception)
        throw ((res as Exception).exception)
    else if ((res as IOErrorResult).error == IOError.AccessDenied && getPlatform() == Platform.Windows) 
        return await requestElevated<T>(method, input)
    else 
        return res
}

async function requestElevated<T extends Result>(method: RequestType, input?: RequestInput) {
 
    const msg = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {})
    }

    let response
    try {
        response = await fetch(`http://localhost:21000/commander/${method}`, msg) 
    } catch (e) {
        await fetch(`http://localhost:20000/commander/startelevated`) 
        alert("OK")
        response = await fetch(`http://localhost:21000/commander/${method}`, msg) 
    }
    const res = await response?.json() as T
    if ((res as Exception).exception)
        throw ((res as Exception).exception)
    else 
        return res
}
