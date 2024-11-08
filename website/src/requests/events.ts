import { filter, Subject } from 'rxjs'
import { FolderViewItem } from '../components/FolderView'
//import { Version } from './requests'
//import { ErrorType } from 'functional-extensions'
import { WebViewType, WebViewEvents } from '../webview.ts'
declare const webViewEvents: WebViewEvents

declare const WebView: WebViewType

// type FilesDrop = {
//     id: string
//     path: string
//     items: FolderViewItem[]
//     move: boolean
// }

// type GetCredentials = { path: string }

export enum DirectoryChangedType {
    Created,
    Changed,
    Renamed,
    Deleted
}

export type DirectoryChangedEvent = {
    folderId: string
    path?: string
    type: DirectoryChangedType
    item: FolderViewItem
    oldName?: string
}

// type ExifTime = {
//     path: string,
//     name: string,
//     exif: string
// }

// type ExtendedData = {
//     path: string,
//     name: string,
//     version: Version
// }

// type CommanderEvent = {
//     copyProgress?: CopyProgress
//     copyError: ErrorType
//     serviceItems?: FolderViewItem[]
//     filesDrop?: FilesDrop
//     getCredentials?: GetCredentials
//     exifTime?: ExifTime
//     extendedData?: ExtendedData
//     showProgress?: boolean
// }

export const menuActionEvents = new Subject<string>()
export const showHiddenEvents = new Subject<boolean>()
export const showPreviewEvents = new Subject<boolean>()
export const directoryChangedEvents = new Subject<DirectoryChangedEvent>()

export const getDirectoryChangedEvents = (folderId: string) =>
    directoryChangedEvents
        .pipe(filter(n => n.folderId == folderId))

const initialize = () => {
    WebView.registerEvents<string>("MenuAction", cmd => menuActionEvents.next(cmd))
    WebView.registerEvents<boolean>("ShowHidden", hidden => showHiddenEvents.next(hidden))
    WebView.registerEvents<boolean>("Preview", preview => showPreviewEvents.next(preview))
    WebView.registerEvents<DirectoryChangedEvent>("DirectoryChanged", e => directoryChangedEvents.next(e))
}
try {
    if (WebView)
        initialize()
} catch { console.log("Initializing web view after loading") }

function onWebViewLoaded() {
    initialize()
}

interface IWindow {
    onWebViewLoaded: (cb: () => void)=>void
}

(window as unknown as IWindow).onWebViewLoaded = onWebViewLoaded
        
// export const folderViewItemsChangedEvents = commanderEvents
//     .pipe(filter(n => n.serviceItems != undefined))
//     .pipe(map(n => n.serviceItems!))

// export const filesDropEvents = commanderEvents
//     .pipe(filter(n => n.filesDrop != undefined))
//     .pipe(map(n => n.filesDrop!))

// export const getCredentialsEvents = commanderEvents
//     .pipe(filter(n => n.getCredentials != undefined))
//     .pipe(map(n => n.getCredentials!))


// export const exifTimeEvents = commanderEvents
//     .pipe(filter(n => n.exifTime != undefined))
//     .pipe(map(n => n.exifTime!))
    
// export const extendedDataEvents = commanderEvents
//     .pipe(filter(n => n.extendedData != undefined))
//     .pipe(map(n => n.extendedData!))

// export const copyErrorEvents = commanderEvents
//     .pipe(filter(n => n.copyError != undefined))
//     .pipe(map(n => n.copyError!))

// export const startUacEvents = () => {
//     const source = new EventSource("http://localhost:21000/commander/sse")
//     const commanderEvents = fromEvent<MessageEvent>(source, 'message')
//         .pipe(map(toCommanderEvent))
//     commanderEvents
//         .pipe(filter(n => n.copyProgress != undefined))
//         .pipe(map(n => n.copyProgress!))
//         .subscribe(progressChangedEvents)
// }
export type ProgressStart = {
    kind: "start",
    totalFiles: number
    totalSize: number
}

export type ProgressFile = {
    kind: "file",
    fileName: string
    currentFile: number
    currentBytes: number
}

type ProgressFinished = {
    kind: "finished",
}

type ProgressDisposed = {
    kind: "disposed",
}

// type CopyProgress = {
//
//     isMove: boolean
//     copyTime: number
// currentFileBytes
//     totalFileBytes: number
//     : number
// }

export type Progress =
    | ProgressStart
    | ProgressFile
    | ProgressFinished
    | ProgressDisposed

const progressChangedEvents = new Subject<Progress>()
let progressesDropper = 0
webViewEvents.registerProgresses((p: Progress) => {
    switch (p.kind) {
        case "start":
            clearTimeout(progressesDropper)
            break
        case "finished":
            progressesDropper = setTimeout(() => progressChangedEvents.next({
                kind: "disposed"
            }), 10_000)
            break
    }
    progressChangedEvents.next(p)
})

export const startProgress = progressChangedEvents
    .pipe(filter(n => n.kind == "start"))
export const fileProgress = progressChangedEvents
    .pipe(filter(n => n.kind == "file"))
export const finishedProgress = progressChangedEvents
    .pipe(filter(n => n.kind == "finished"))
export const disposedProgress = progressChangedEvents
    .pipe(filter(n => n.kind == "disposed"))


