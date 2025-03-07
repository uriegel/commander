import { FolderViewItem } from "../components/FolderView"
import { ErrorType } from "functional-extensions"
import { getPort } from "../globals"

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

export type ExtendedItem = {
    exifData?: ExifData
    version?: Version
}

export type GetExtendedItemsResult = {
    extendedItems: ExtendedItem[]
    path: string
}

export enum IOError {
    Unknown,
    AccessDenied,
    AlreadyExists,
    FileNotFound,
    DeleteToTrashNotPossible,
    NetNameNotFound,
    PathNotFound,
    NotSupported,
    PathTooLong,
    Cancelled,
    WrongCredentials,
    NoDiskSpace,
    OperationInProgress,
    Dropped,
    ConnectionRefused,
    UacNotStarted = 1099
}

// export type CopyItem = {
//     name: string
//     subPath?: string
//     isDirectory?: boolean | undefined
//     size: number | undefined
//     //time: string | undefined
//     //targetSize?: number | undefined
//     //targetTime?: string | undefined
// }

type ResultType<T, E extends ErrorType> = {
    ok: T
    error: E
}

export class RequestError extends Error {
    constructor(public status: IOError, public statusText: string) {
        super(statusText)
    }
}

export const webViewRequest = async <T>(method: string, payload?: object) => {

    const msg = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }

    const response = await fetch(`http://localhost:${getPort()}/json/${method}`, msg) 
    const res = await response.json() as ResultType<T, RequestError>
    if (res.error)
        throw new RequestError(res.error.status, res.error.statusText)
    return res.ok 
}

















