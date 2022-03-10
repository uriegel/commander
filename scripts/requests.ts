 
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

type GetItemsType = {
    path?:    string,
    engineId: number
    requestId: number
}

export enum ItemType {
    File      = 1,
    Directory = 2,
    Harddrive = 3,
    Homedrive = 4
}

type RootItem = {
    name:        string,
    description: string,
    itemType:    ItemType,
    mountPoint:  string,
    driveType:   string,
    isMounted:   boolean,
    size:        number,
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
    items: RootItem[]
    path: string
    engineId: number
    requestId: number
    columns?: Column[]
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