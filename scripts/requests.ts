import { FolderItem } from "./components/folder"

 
export const ShowDevTools = "showdevtools"
export const ShowFullscreen = "showfullscreen"
type ShowDevToolsType = "showdevtools"
type ShowFullscreenType = "showfullscreen"
type GetItems = "getitems"
export type RequestType = 
    ShowDevToolsType | 
    ShowFullscreenType |
    GetItems

type Empty = {}

export enum EngineType {
    None =      0,     
    Root =      1,
    Directory = 2
}

type GetItemsType = {
    path?:        string,
    engine:       EngineType
    currentItem?: FolderItem
}

export enum ItemType {
    File      = 1,
    Directory = 2,
    Harddrive = 3,
    Homedrive = 4
}

export enum ColumnsType {
    Normal = 1,
    Name   = 2,
    Size   = 3  
}

type Column = {
    name: string
    column: string
    type: ColumnsType
}

export type GetItemResult = {
    items:     string
    path:      string
    engine:    EngineType
    columns?:  Column[]
}

type Exception = {
    exception: string
}

type Result = GetItemResult | Exception
    
export type RequestInput = Empty | GetItemsType

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