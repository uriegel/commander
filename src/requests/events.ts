import { BehaviorSubject, filter, fromEvent, map } from 'rxjs'
import { FolderViewItem } from '../components/FolderView'

type CopyProgress = {
    fileName: string
    totalCount: number
    currentCount: number
    copyTime: number
    totalFileBytes: number
    currentFileBytes: number
    totalBytes: number
    currentBytes: number
    isStarted: boolean
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

type CommanderEvent = {
    theme?:        string
    copyProgress?: CopyProgress
    windowState?: WindowState
    serviceItems?: FolderViewItem[]
    filesDrop?: FilesDrop
    getCredentials?: GetCredentials
}

const toCommanderEvent = (event: MessageEvent) =>
    JSON.parse(event.data) as CommanderEvent

const source = new EventSource("http://localhost:20000/commander/sse")



source.onmessage = s => console.log("Event", s)

const commanderEvents = fromEvent<MessageEvent>(source, 'message')
    .pipe(map(toCommanderEvent))

export const themeChangedEvents = commanderEvents
    .pipe(filter(n => n.theme != undefined))
    .pipe(map(n => n.theme!))

export const windowStateChangedEvents = commanderEvents
    .pipe(filter(n => n.windowState != undefined))
    .pipe(map(n => n.windowState!.maximized))

export const folderViewItemsChangedEvents = commanderEvents
    .pipe(filter(n => n.serviceItems != undefined))
    .pipe(map(n => n.serviceItems!))

export const filesDropEvents = commanderEvents
    .pipe(filter(n => n.filesDrop != undefined))
    .pipe(map(n => n.filesDrop!))

export const getCredentialsEvents = commanderEvents
    .pipe(filter(n => n.getCredentials != undefined))
    .pipe(map(n => n.getCredentials!))

export const progressChangedEvents = new BehaviorSubject<CopyProgress>({
    fileName: "",
    totalCount: 0,
    currentCount: 0,
    copyTime: 0,
    totalFileBytes: 0,
    currentFileBytes: 0,
    totalBytes: 0,
    currentBytes: 0,
    isStarted: false,
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
