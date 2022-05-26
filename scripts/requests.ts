import { TableItem } from "virtual-table-component"
import { requestBox } from "./commander"
import { FolderItem } from "./components/folder"
import { RemoteItem } from "./remotes"

type ShowDevToolsType =   "showdevtools"
type ShowFullscreenType = "showfullscreen"
type MaximizeType       = "maximize"
type MinimizeType       = "minimize"
type RestoreType =        "restore"
type CloseType =          "close"
type GetItems =           "getitems"
type GetFilePath =        "getfilepath"
type PutRemotes =         "putremotes"
type GetActionsTexts =    "getactionstexts"
type CreateFolder =       "createfolder"
type DeleteItems =        "deleteitems"
type RenameItem =         "renameitem"
type GetCopyConflicts =   "getcopyconflicts"
type CopyItems =          "copyitems"

export type RequestType = 
    | ShowDevToolsType 
    | ShowFullscreenType 
    | MaximizeType
    | MinimizeType
    | RestoreType
    | CloseType
    | GetItems 
    | GetFilePath 
    | PutRemotes 
    | GetActionsTexts 
    | CreateFolder
    | DeleteItems
    | RenameItem
    | GetCopyConflicts
    | CopyItems

type Empty = {}

export enum EngineType {
    None =      0,     
    Root =      1,
    Directory = 2
}

type GetItemsType = {
    folderId?:    string
    requestId?:   number,
    path?:        string,
    engine:       EngineType
    currentItem?: FolderItem
}

type GetFilePathType = {
    path:        string,
    engine:      EngineType
    currentItem: FolderItem
}

type PutRemotesType = {
    folderId: string,
    remotes: RemoteItem[]
}

type CreateFolderType = {
    engineType: EngineType
    path:       string
    name:       string
}

type RenameItemType = {
    engineType: EngineType
    path:       string
    name:       string
    newName:    string
}

type DeleteItemsType = {
    engineType: EngineType
    path:       string
    items:      string[]
}

type CopyItemsType = {
    sourceEngineType: EngineType
    targetEngineType: EngineType
    sourcePath:       string
    targetPath:       string
    items:            string[]
    move?:            boolean
}

export enum ActionType {
    Delete       = 0,
    CreateFolder = 1,
    Rename       = 2,
    Copy         = 3,
    Move         = 4
}

type GetActionsTextsType = {
    engineType:       EngineType
    otherEngineType?: EngineType
    type:             ActionType
    dirs:             number
    files:            number
}

export enum ItemType {
    Parent        = 1,
    File          = 2,
    Directory     = 3,
    Harddrive     = 4,
    Homedrive     = 5,
    Remotes       = 6,
    AddRemote     = 7,
    Remote        = 8,
    AndroidRemote = 9,
}

export enum ColumnsType {
    Normal        = 1,
    Name          = 2,
    NameExtension = 3,
    Size          = 4,  
    Time          = 5,
    Version       = 6
}

export type Column = {
    name: string
    column: string
    type: ColumnsType
}

export type GetItemResult = {
    items:         FolderItem[]
    path:          string
    engine:        EngineType
    columns?:      Column[]
    latestPath?:   string
    withEnhanced?: boolean
}

export type GetFilePathResult = {
    path: string
}

export interface ConflictItem extends TableItem {
    conflict:    string
    isDirectory: boolean
    iconPath?:   string
    sourceTime:  string
    targetTime:  string
    sourceSize:  number
    targetSize:  number
}

type Exception = {
    exception: string
}

export type Nothing = { }

export type GetActionTextResult = { result: string| null}


type AccessDenied = {
    Case: "AccessDenied"
}

type AlreadyExists = {
    Case: "AlreadyExists"
}

type FileNotFound = {
    Case: "FileNotFound"
}

type DeleteToTrashNotPossible = {
    Case: "DeleteToTrashNotPossible"
}

type Exn = {
    Case: "Exception"
}

export type IOError =
    | AccessDenied
    | AlreadyExists
    | FileNotFound
    | DeleteToTrashNotPossible
    | Exn 

export type IOErrorResult = {
    error: IOError
}

type Result = 
    | GetItemResult 
    | Exception 
    | GetFilePathResult 
    | Nothing 
    | GetActionTextResult
    | IOErrorResult
    | ConflictItem[]

export type RequestInput = 
    | Empty  
    | GetItemsType 
    | GetFilePathType 
    | PutRemotesType 
    | GetActionsTextsType 
    | CreateFolderType
    | RenameItemType
    | DeleteItemsType
    | CopyItemsType

async function checkAdmin() {
    try {
        (await fetch("http://localhost:20001/commander/check")).status
        return true
    } catch { 
        return false
    }
}    

export async function request<T extends Result>(method: RequestType, input?: RequestInput) {

    const msg = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {})
    }

    const response = await fetch(`commander/${method}`, msg) 
    const res = await response.json() as T
    if ((res as Exception).exception)
        throw ((res as Exception).exception)
    else {
        const ioError = res as IOErrorResult
        if (ioError?.error && ioError.error.Case == "AccessDenied" && await checkAdmin()) {
            if (!await requestBox("Administratorrechte für diese Aktion gewähren"))
                return res
            try {
                const response = await fetch(`http://localhost:20001/commander/${method}`, msg)
                const resAdmin = await response.json() as T
                if ((resAdmin as Exception).exception)
                    return res
                else {
                    const ioError = resAdmin as IOErrorResult
                    if (ioError?.error)
                        return res
                    else
                        return resAdmin
                }
            } catch { 
                return res    
            }
        }
        else
            return res
    }
}

