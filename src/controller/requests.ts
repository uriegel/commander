import { TableRowItem } from "virtual-table-react"

export type Nothing = {}

type Result = 
	| Nothing 
    | Exception
    | GetItemResult 

export interface FolderItem extends TableRowItem {
    name:        string
    isHidden:    boolean
    isDirectory: boolean
    iconPath:    string
    size:        number
    time:        string
}

export type GetItemResult = {
    items: FolderItem[]
    path:  string
}

type Close = "close"
export type GetFiles = "getfiles"

type RequestType = 
	| Close
	| GetFiles
	
type Exception = {
	exception: string
}	

type GetFilesType = {
    path:            string,
    showHiddenItems: boolean
}

type Empty = {
    empty?: string
}

export type RequestInput = 
    | Empty  
	| GetFilesType 
	
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
