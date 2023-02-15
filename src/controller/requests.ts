import { TableRowItem } from "virtual-table-react"

export type Nothing = {}

type Result = 
	| Nothing 
    | Exception
    | GetRootResult 
    | GetItemResult 
    | GetExtendedItemsResult

export interface RootItem extends TableRowItem {
    name:        string
    description: string
    size:        number
    isMounted?:  boolean
    mountPoint?: string
}

export interface FolderItem extends TableRowItem {
    name:        string
    isHidden:    boolean
    isDirectory: boolean
    iconPath:    string
    size:        number
    time:        string
    isParent?:   boolean
}

export type GetItemResult = {
    items: FolderItem[]
    path:  string
}

export type ExtendedItem = {
    date: string
}

export type GetExtendedItemsResult = {
    extendedItems: ExtendedItem[]
    path: string
}

export type GetRootResult = RootItem[]

type Close = "close"
export type GetRoot = "getroot"
export type GetFiles = "getfiles"
export type GetExtendedItems = "getextendeditems"

type RequestType = 
	| Close
	| GetRoot
    | GetFiles
    | GetExtendedItems
	
type Exception = {
	exception: string
}	

type GetFilesType = {
    path:            string,
    showHiddenItems: boolean
}

type GetExtendedItemsType = {
    path: string,
    items: string[]
}

type Empty = {
    empty?: string
}

export type RequestInput = 
    | Empty  
    | GetFilesType 
    | GetExtendedItemsType
	
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
    else {
        return res
    }
}
