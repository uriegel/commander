 
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

type RootItem = {
    description: string,
    name:        string,
    type:        number,
    mountPoint:  string,
    driveType:   string,
    isMounted:   boolean,
    size:        number,
}

type Column = {
    name: string
    column: string
    rightAligned: boolean
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