import { TableRowItem } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"

export type Nothing = {}

type Result = 
	| Nothing 
    | Exception
    | GetRootResult 
    | GetItemResult 
    | GetExtendedItemsResult
    | IOErrorResult

export interface RootItem extends TableRowItem {
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

export type ExtendedItem = {
    date?: string
    version?: Version
}

export type GetExtendedItemsResult = {
    extendedItems: ExtendedItem[]
    path: string
}

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

export type GetRootResult = RootItem[]

type Close = "close"
export type GetRoot = "getroot"
export type GetFiles = "getfiles"
export type GetExtendedItems = "getextendeditems"
export type ShowDevTools = "showdevtools"
export type ShowFullScreen = "showfullscreen"
export type RenameItem = "renameitem"

type RequestType = 
	| Close
	| GetRoot
    | GetFiles
    | GetExtendedItems
    | ShowDevTools
    | ShowFullScreen
    | RenameItem
	
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

type RenameItemType = {
    path:     string
    name:     string
    newName:  string
}

type Empty = {
    empty?: string
}

export type RequestInput = 
    | Empty  
    | GetFilesType 
    | GetExtendedItemsType
    | RenameItemType
	
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

