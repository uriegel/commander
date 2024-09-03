import { FolderViewItem } from "../components/FolderView"
import { AsyncResult, Err, ErrorType, Nothing, Ok, Result } from "functional-extensions"
import { WebViewType } from "../webview"

declare var WebView: WebViewType

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

export type CopyItem = {
    name: string
    subPath?: string
    isDirectory?: boolean | undefined
    size: number | undefined
    time: string | undefined
    targetSize?: number | undefined
    targetTime?: string | undefined
}

type ResultType = {
    ok: any
    err: any
}

export const webViewRequest = <T, E extends ErrorType>(method: string, payload?: any) => {
    let request = async () : Promise<Result<T, E>> => {
        const ret = await WebView.request(method, payload || {}) as ResultType
        return ret.ok
            ? new Ok<T, E>(ret.ok) 
            : new Err<T, E>(ret.err)
    }
    return  new AsyncResult<T, E>(request())
}

export const closeWindow = () => 
    webViewRequest<Nothing, ErrorType>("close")

