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
type GetRoot = "getroot"
type GetFiles = "getfiles"
type GetExtendedItems = "getextendeditems"
type ShowDevTools = "showdevtools"
type ShowFullScreen = "showfullscreen"
type RenameItem = "renameitem"
type CreateFolder = "createfolder"
type DeleteItems = "deleteitems"

type RequestType = 
	| Close
	| GetRoot
    | GetFiles
    | GetExtendedItems
    | ShowDevTools
    | ShowFullScreen
    | RenameItem
    | CreateFolder
    | DeleteItems
    
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

type CreateFolderType = {
    path:       string
    name:       string
}

type DeleteItemsType = {
    path:       string
    names:      string[]
}

type Empty = {
    empty?: string
}

export type RequestInput = 
    | Empty  
    | GetFilesType 
    | GetExtendedItemsType
    | RenameItemType
    | CreateFolderType
    | DeleteItemsType
	
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

