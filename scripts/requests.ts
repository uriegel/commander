import { FolderItem } from "./components/folder"

export const ShowDevTools = "showdevtools"
export const ShowFullscreen = "showfullscreen"
type ShowDevToolsType = "showdevtools"
type ShowFullscreenType = "showfullscreen"
type GetItems = "getitems"
type GetFilePath = "getfilepath"

export type RequestType = 
    ShowDevToolsType | 
    ShowFullscreenType |
    GetItems |
    GetFilePath

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

export enum ItemType {
    Parent    = 1,
    File      = 2,
    Directory = 3,
    Harddrive = 4,
    Homedrive = 5,
    Remotes   = 6,
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
    items:       FolderItem[]
    path:        string
    engine:      EngineType
    columns?:    Column[]
    latestPath?: string
}

export type GetFilePathResult = {
    path: string
}

type Exception = {
    exception: string
}

type Result = GetItemResult | Exception | GetFilePathResult
    
export type RequestInput = Empty | GetItemsType | GetFilePathType

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