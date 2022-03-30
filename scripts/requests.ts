import { FolderItem } from "./components/folder"
import { RemoteItem } from "./remotes"

export const ShowDevTools = "showdevtools"
export const ShowFullscreen = "showfullscreen"
type ShowDevToolsType = "showdevtools"
type ShowFullscreenType = "showfullscreen"
type GetItems = "getitems"
type GetFilePath = "getfilepath"
type PutRemotes = "putremotes"
type GetActionsTexts = "getactionstexts"
type CreateFolder = "createfolder"


export type RequestType = 
    | ShowDevToolsType 
    | ShowFullscreenType 
    | GetItems 
    | GetFilePath 
    | PutRemotes 
    | GetActionsTexts 
    | CreateFolder

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

type CreatefolderType = {
    engineType: EngineType
    path:       string
    name:       string
}

export enum ActionType {
    Delete = 0,
    CreateFolder = 1
}

type GetActionsTextsType = {
    engineType: EngineType
    type:       ActionType
    dirs:       number
    files:      number
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

type Exn = {
    Case: "Exception"
}

type IOError =
    | AccessDenied
    | AlreadyExists
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

export type RequestInput = 
    | Empty  
    | GetItemsType 
    | GetFilePathType 
    | PutRemotesType 
    | GetActionsTextsType 
    | CreatefolderType

export async function request<T extends Result>(method: RequestType, input?: RequestInput) {
    const response = await fetch(`commander/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {})
    }) 
    const res = await response.json() as T
    if ((res as Exception).exception)
        throw ((res as Exception).exception)
    else
        return res
}