import { filter, Subject } from 'rxjs'
import { FolderViewItem } from '../components/FolderView'
//import { Version } from './requests'
//import { ErrorType } from 'functional-extensions'
import { getPort } from '../globals.ts'

export const menuActionEvents = new Subject<string>()
export const showPreviewEvents = new Subject<boolean>()
export const showHiddenEvents = new Subject<boolean>()

enum EventType {
    MenuAction,
    PreviewAction,
    ShowHiddenAction
}

type Event = {
    eventType: EventType
    menuAction?: string
    previewOn?: boolean
    showHidden?: boolean
}

const ws = new WebSocket(`ws://localhost:${getPort()}/eventsink`)
ws.onopen = () => console.log("global event sink opened")
ws.onclose = () => console.log("global event sink closed")
ws.onmessage = e => {
    const evt = JSON.parse(e.data) as Event
    console.log("Event gekommen:", evt)
    switch (evt.eventType) {
        case EventType.MenuAction:
            if (evt.menuAction)
                menuActionEvents.next(evt.menuAction)
            break
        case EventType.PreviewAction:
            showPreviewEvents.next(evt.previewOn == true)
            break
        case EventType.ShowHiddenAction:
            showHiddenEvents.next(evt.showHidden == true)
            break
        }
}
    

///
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
//     copyError: ErrorType
//     serviceItems?: FolderViewItem[]
//     filesDrop?: FilesDrop
//     getCredentials?: GetCredentials
//     exifTime?: ExifTime
//     extendedData?: ExtendedData
//     showProgress?: boolean
// }


export const directoryChangedEvents = new Subject<DirectoryChangedEvent>()

export const getDirectoryChangedEvents = (folderId: string) =>
    directoryChangedEvents
        .pipe(filter(n => n.folderId == folderId))

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
    isMove: boolean, 
    totalFiles: number
    totalSize: number
}

export type ProgressFile = {
    kind: "file",
    fileName: string
    currentBytes: number
    currentFiles: number

}

export type ProgressBytes = {
    kind: "bytes",
    currentBytes: number
    totalBytes: number
    completeCurrentBytes: number
    completeTotalBytes: number
    totalSeconds: number
}

type ProgressFinished = {
    kind: "finished",
    totalSeconds: number
}

type ProgressDisposed = {
    kind: "disposed",
}

export type Progress =
    | ProgressStart
    | ProgressFile
    | ProgressFinished
    | ProgressDisposed
    | ProgressBytes

const progressChangedEvents = new Subject<Progress>()
// let totalCurrentBytes = 0
// let totalBytes = 0
// let progressesDropper = 0
// webViewEvents.registerProgresses((p: Progress) => {
//     switch (p.kind) {
//         case "start":
//             clearTimeout(progressesDropper)
//             totalCurrentBytes = 0
//             totalBytes = p.totalSize
//             break
//         case "file":
//             totalCurrentBytes = p.currentBytes
//             break
//         case "bytes":
//             p.completeCurrentBytes = totalCurrentBytes
//             p.completeTotalBytes = totalBytes
//             break
//         case "finished":
//             progressChangedEvents.next({
//                 kind: 'bytes',
//                 completeCurrentBytes: totalBytes,
//                 completeTotalBytes: totalBytes,
//                 currentBytes: 0,
//                 totalBytes,
//                 totalSeconds: p.totalSeconds
//             })
//             progressesDropper = setTimeout(() => progressChangedEvents.next({
//                 kind: "disposed"
//             }), 10_000)
//             break
//     }
//     progressChangedEvents.next(p)
// })

export const startProgress = progressChangedEvents
    .pipe(filter(n => n.kind == "start"))
export const fileProgress = progressChangedEvents
    .pipe(filter(n => n.kind == "file"))
export const byteProgress = progressChangedEvents
    .pipe(filter(n => n.kind == "bytes"))
export const finishedProgress = progressChangedEvents
    .pipe(filter(n => n.kind == "finished"))
export const disposedProgress = progressChangedEvents
    .pipe(filter(n => n.kind == "disposed"))

