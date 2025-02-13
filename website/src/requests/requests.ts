import { FolderViewItem } from "../components/FolderView"
import { ErrorType } from "functional-extensions"
import { WebViewType } from "../webview"

declare const WebView: WebViewType

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
    err: E
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

    const response = await fetch(`http://localhost:8080/json/${method}`, msg) 
    const res = await response.json() as ResultType<T, RequestError>
    if (res.err)
        throw new RequestError(res.err.status, res.err.statusText)
    return res.ok 
}

















