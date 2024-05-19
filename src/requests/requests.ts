import { FolderViewItem } from "../components/FolderView"
import { ErrorType, Nothing, jsonPost, setBaseUrl } from "functional-extensions"

setBaseUrl("http://localhost:20000/commander")

export type GetItemsResult = {
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

export type ExifData = {
    dateTime?: string 
    latitude?: number
    longitude?: number
}

export type GetExtendedItemsResult = {
    exifDatas: (ExifData | null)[]
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
    OperationInProgress,
    NoError,
    UacNotStarted = 1099
}

export const closeWindow = () => 
    jsonPost<Nothing, ErrorType>({ method: "close" })

export type CopyItem = {
    name: string
    subPath?: string
    isDirectory?: boolean | undefined
    size: number | undefined
    time: string | undefined
    targetSize?: number | undefined
    targetTime?: string | undefined
}



	
