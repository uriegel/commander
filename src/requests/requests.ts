import { SpecialKeys } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import { ErrorType, jsonPost, setBaseUrl } from "functional-extensions"

export type Nothing = NonNullable<unknown>

setBaseUrl("http://localhost:20000/commander")

export interface RootItem {
    name:        string
    description: string
    size:        number
    isMounted?:  boolean
    mountPoint?: string
}

export interface ServiceItem {
    name:        string
    description: string
} 

export type GetItemsResult = {
    items: FolderViewItem[]
    dirCount: number
    fileCount: number
    path:  string
}

export type GetItemsError = {
    status: number 
    statusText: string
    path:  string
}

export type Version = {
    major: number
    minor: number
    patch: number
    build: number
}

export type CredentialsResult = {
    name: string
    password: string
}

export type GetExtendedItemsResult = {
    exifTimes: (string | null)[]
    versions?: (Version | null)[]
    path: string
}

export enum IOError {
    Unknown,
    AccessDenied,
    AlreadyExists,
    FileNotFound,
    DeleteToTrashNotPossible,
    Exn,
    NetNameNotFound,
    PathNotFound,
    NotSupported,
    PathTooLong,
    Canceled,
    WrongCredentials,
    NoDiskSpace,
    NoError,
    UacNotStarted = 1099
}

export const closeWindow = () => 
    jsonPost<Nothing, ErrorType>({ method: "close" })


export interface IOErrorResult {
    error?: IOError
}

export type GetRootResult = RootItem[]

type GetFilesType = {
    path:            string,
    showHiddenItems: boolean,
    mount?:          boolean
}

type GetExtendedItemsType = {
    id: string,
    path: string,
    items: string[]
}

type StartServiceType = {
    items: string[]
}

type CancelExtendedItemsType = {
    id: string
}

type RenameItemType = {
    path:     string
    name:     string
    newName:  string
}

type RenameItemData = {
    name:     string
    newName:  string
}

type RenameItemsType = {
    path:     string
    items:    RenameItemData[]
}

type OnEnterType = {
    path: string
    keys?: SpecialKeys
}

type CreateFolderType = {
    path:       string
    name:       string
}

type DeleteItemsType = {
    path:       string
    names:      string[]
}

export type CopyItem = {
    name: string
    subPath?: string
    isDirectory?: boolean | undefined
    size: number | undefined
    time: string | undefined
    targetSize?: number | undefined
    targetTime?: string | undefined
}

type CopyItemsType = {
    path:        string
    targetPath:  string
    items:       CopyItem[]
    move:        boolean
}

type CredentialsType = {
    path: string
    name: string,
    password: string
}


type Empty = {
    empty?: string
}

export type RequestInput = 
    | Empty  
    | GetFilesType 
    | GetExtendedItemsType
    | CancelExtendedItemsType
    | RenameItemType
    | CreateFolderType
    | DeleteItemsType
    | CopyItemsType
    | RenameItemsType
    | OnEnterType
    | StartServiceType
    | CredentialsType
	
