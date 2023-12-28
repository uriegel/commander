import { SpecialKeys } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import { Platform, getPlatform } from "../globals"
import { DialogHandle, ResultType } from 'web-dialog-react'
import { startUacEvents } from "./events"
import { setBaseUrl } from "functional-extensions"

export type Nothing = NonNullable<unknown>

setBaseUrl("http://localhost:20000/commander")

type Result = 
	| Nothing 
    | Exception
    | GetRootResult 
    | GetItemsResult 
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

export interface ServiceItem {
    name:        string
    description: string
} 

export type GetItemsResult = {
    items: FolderViewItem[]
    dirCount: number
    fileCount: number
    path:  string
}

export type GetItemsError = {
    status: number 
    statusText: string
    path:  string
}

export type Version = {
    major: number
    minor: number
    patch: number
    build: number
}

export type CredentialsResult = {
    name: string
    password: string
}

export type GetExtendedItemsResult = {
    exifTimes: (string | null)[]
    versions?: (Version | null)[]
    path: string
}

export enum IOError {
    Unknown,
    AccessDenied,
    AlreadyExists,
    FileNotFound,
    DeleteToTrashNotPossible,
    Exn,
    NetNameNotFound,
    PathNotFound,
    NotSupported,
    PathTooLong,
    Canceled,
    WrongCredentials,
    NoError,
    UacNotStarted = 1099
}

export interface IOErrorResult {
    error?: IOError
}

export type GetRootResult = RootItem[]

export type GetServicesResult = ServiceItem[]

type Close = "close"
type GetRoot = "getroot"
type GetFiles = "getfiles"
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
type RenameAndCopy = "renameandcopy"
type OnEnter = "onenter"
type InitServices = "initservices"
type GetServices = "getservices"
type CleanUpServices = "cleanupservices"
type StartServices = "startservices"
type StopServices = "stopservices"
type ElevateDrive = "elevatedrive"

type RequestType = 
	| Close
	| GetRoot
    | GetFiles
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
    | RenameAndCopy
    | OnEnter
    | InitServices
    | GetServices
    | CleanUpServices
    | StartServices
    | StopServices
    | ElevateDrive
    
type Exception = {
	exception: string
}	

type GetFilesType = {
    path:            string,
    showHiddenItems: boolean,
    mount?:          boolean
}

type GetExtendedItemsType = {
    id: string,
    path: string,
    items: string[]
}

type StartServiceType = {
    items: string[]
}

type CancelExtendedItemsType = {
    id: string
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

type CopyItemsType = {
    path:        string
    targetPath:  string
    items:       CopyItem[]
    move:        boolean
}

type CredentialsType = {
    path: string
    name: string,
    password: string
}


type Empty = {
    empty?: string
}

export type RequestInput = 
    | Empty  
    | GetFilesType 
    | GetExtendedItemsType
    | CancelExtendedItemsType
    | RenameItemType
    | CreateFolderType
    | DeleteItemsType
    | CopyItemsType
    | RenameItemsType
    | OnEnterType
    | StartServiceType
    | CredentialsType
	
export async function request<T extends Result>(method: RequestType, input?: RequestInput, dialog?: DialogHandle|null, uacShown?: (uac: boolean)=>void) {
 
    const msg = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {})
    }

    const response = await fetch(`http://localhost:20000/commander/${method}`, msg) 

    if (elevatedStarted && method == "cancelCopy")
        await fetch(`http://localhost:21000/commander/${method}`, msg) 

    const res = await response.json() as T
    if ((res as Exception).exception)
        throw ((res as Exception).exception)
    else if (dialog && input && (res as IOErrorResult).error == IOError.AccessDenied && getPlatform() == Platform.Windows) 
        return await requestElevated<T>(method, input, dialog, uacShown)
    else 
        return res
}

type StartElevated = {
    ok: boolean
}


async function requestElevated<T extends Result>(method: RequestType, input: RequestInput, dialog: DialogHandle, uacShown?: (uac: boolean)=>void) {

    const startElevated = async () => {
        const res = await fetch(`http://localhost:20000/commander/startelevated`) 
        const ok = await res.json() as StartElevated
        elevatedStarted = ok.ok
        if (elevatedStarted)
            startUacEvents()
        return ok.ok
    }

    if (uacShown)
        uacShown(true)

    const withElevation = elevatedStarted
        ? (await dialog.show({
                text: "Diese Aktion als Administrator ausführen?",
                btnOk: true,
                btnCancel: true,
                defBtnCancel: true
            })).result == ResultType.Ok
        : await startElevated()
    
    if (uacShown)
        uacShown(false)

    const msg = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {})
    }

    if (!withElevation)
        return {
            error: IOError.AccessDenied
        } as T

    let response
    try {
        response = await fetch(`http://localhost:21000/commander/${method}`, msg) 
    } catch (e) {
        if (uacShown)
            uacShown(true)
        await startElevated()
        if (uacShown)
            uacShown(false)
        response = await fetch(`http://localhost:21000/commander/${method}`, msg) 
    }
    const res = await response?.json() as T
    if ((res as Exception).exception)
        throw ((res as Exception).exception)
    else 
        return res
}

let elevatedStarted = false