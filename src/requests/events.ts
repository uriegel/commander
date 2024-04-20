import { BehaviorSubject, filter, fromEvent, map } from 'rxjs'
import { FolderViewItem } from '../components/FolderView'
import { Version } from './requests'
import { ErrorType } from 'functional-extensions'

type CopyProgress = {
    fileName: string
    isMove: boolean
    totalCount: number
    currentCount: number
    copyTime: number
    totalFileBytes: number
    currentFileBytes: number
    totalBytes: number
    currentBytes: number
    isStarted: boolean
    isDisposed: boolean
    isFinished: boolean
}

type WindowState = {
    maximized: boolean
}

type FilesDrop = {
    id: string
    path: string
    items: FolderViewItem[]
    move: boolean
}

type GetCredentials = { path: string }

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

type ExifTime = {
    path: string,
    name: string,
    exif: string
}

type ExtendedData = {
    path: string,
    name: string,
    version: Version
}

type CommanderEvent = {
    theme?:        string
    copyProgress?: CopyProgress
    copyError: ErrorType
    windowState?: WindowState
    serviceItems?: FolderViewItem[]
    filesDrop?: FilesDrop
    getCredentials?: GetCredentials
    directoryChanged?: DirectoryChangedEvent
    exifTime?: ExifTime
    extendedData?: ExtendedData
    showProgress?: boolean
    preview?: boolean
    menuAction?: string
}

const toCommanderEvent = (event: MessageEvent) =>
    JSON.parse(event.data) as CommanderEvent

const source = new EventSource("http://localhost:20000/commander/sse")

const commanderEvents = fromEvent<MessageEvent>(source, 'message')
    .pipe(map(toCommanderEvent))

export const themeChangedEvents = commanderEvents
    .pipe(filter(n => n.theme != undefined))
    .pipe(map(n => n.theme!))

export const windowStateChangedEvents = commanderEvents
    .pipe(filter(n => n.windowState != undefined))
    .pipe(map(n => n.windowState!.maximized))

export const previewEvents = commanderEvents
    .pipe(filter(n => n.preview != undefined))
    .pipe(map(n => n.preview!))

export const menuActionEvents = commanderEvents
    .pipe(filter(n => n.menuAction != undefined))
    .pipe(map(n => n.menuAction!))

export const folderViewItemsChangedEvents = commanderEvents
    .pipe(filter(n => n.serviceItems != undefined))
    .pipe(map(n => n.serviceItems!))

export const filesDropEvents = commanderEvents
    .pipe(filter(n => n.filesDrop != undefined))
    .pipe(map(n => n.filesDrop!))

export const getCredentialsEvents = commanderEvents
    .pipe(filter(n => n.getCredentials != undefined))
    .pipe(map(n => n.getCredentials!))

export const getDirectoryChangedEvents = (folderId: string) =>
    commanderEvents
        .pipe(filter(n => n.directoryChanged != undefined && n.directoryChanged.folderId == folderId))
        .pipe(map(n => n.directoryChanged!))

export const exifTimeEvents = commanderEvents
    .pipe(filter(n => n.exifTime != undefined))
    .pipe(map(n => n.exifTime!))
    
export const extendedDataEvents = commanderEvents
    .pipe(filter(n => n.extendedData != undefined))
    .pipe(map(n => n.extendedData!))

export const copyErrorEvents = commanderEvents
    .pipe(filter(n => n.copyError != undefined))
    .pipe(map(n => n.copyError!))

export const showProgressEvents = commanderEvents
    .pipe(filter(n => n.showProgress == true))
    .pipe(map(() => true))

export const progressChangedEvents = new BehaviorSubject<CopyProgress>({
    fileName: "",
    isMove: false,
    totalCount: 0,
    currentCount: 0,
    copyTime: 0,
    totalFileBytes: 0,
    currentFileBytes: 0,
    totalBytes: 0,
    currentBytes: 0,
    isStarted: false,
    isDisposed: false,
    isFinished: false
})

export const startUacEvents = () => {
    const source = new EventSource("http://localhost:21000/commander/sse")
    const commanderEvents = fromEvent<MessageEvent>(source, 'message')
        .pipe(map(toCommanderEvent))
    commanderEvents
        .pipe(filter(n => n.copyProgress != undefined))
        .pipe(map(n => n.copyProgress!))
        .subscribe(progressChangedEvents)
}

commanderEvents
    .pipe(filter(n => n.copyProgress != undefined))
    .pipe(map(n => n.copyProgress!))
    .subscribe(progressChangedEvents)
