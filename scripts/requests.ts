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
type PrepareFileCopy =    "preparefilecopy"
type PrepareCopy =        "preparecopy"
type CopyItems =          "copyitems"
type PostCopyItems =      "postcopyitems"

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
    | PrepareFileCopy
    | PrepareCopy
    | CopyItems
    | PostCopyItems

type Empty = {
    empty?: string
}

export enum EngineType {
    None =      0,     
    Root =      1,
    Directory = 2
}

type GetItemsType = {
    folderId?:       string
    requestId?:      number,
    path?:           string | null | undefined,
    engine:          EngineType
    currentItem?:    FolderItem | undefined
    showHiddenItems: boolean
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
    engine:     EngineType
    path:       string
    name:       string
}

type RenameItemType = {
    engine:     EngineType
    path:       string
    name:       string
    newName:    string
}

type DeleteItemsType = {
    engine:     EngineType
    path:       string
    items:      string[]
}

type PrepareCopyItemsType = {
    folderId:          string
    sourceEngineType:  EngineType
    sourcePath:        string
    targetEngineType:  EngineType
    targetPath:        string
    Items:             string[]
    move:              boolean
}

type CopyItemsType = {
    folderId:          string
    sourcePath:        string
    sourceEngineType:  EngineType
    targetEngineType:  EngineType
    move:              boolean
    conflictsExcluded: boolean
}

type PostCopyItemsType = {
    sourceEngineType: EngineType
    targetEngineType: EngineType
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
    conflicts?:       boolean
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
    | PrepareCopyItemsType
    | CopyItemsType
    | PostCopyItemsType
    | string[]

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

