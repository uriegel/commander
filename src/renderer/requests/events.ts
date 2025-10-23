import { filter, map, Observable, Subscriber } from 'rxjs'
import { ID_LEFT, ID_RIGHT } from '../components/Commander'

export type ExifData = {
    idx: number,
    dateTime?: string,
    latitude?: number,
    longitude?: number
}

export type ExifDataType = {
    requestId: number,
    items: ExifData[]
}

export type ExifStatus = {
    requestId: number
}

export type CopyProgress = {
    idx: number,
    currentBytes: number,
    currentMaxBytes: number,
    totalBytes: number,
    totalMaxBytes: number,
    move?: boolean,
    items?: string[]
}

type EventData = ExifDataType | ExifStatus| CopyProgress

type EventCmd = "Exif" | "ExifStart" | "ExifStop" | "CopyProgress"

type Event = {
    folderId?: string,
    cmd: EventCmd,
    msg: EventData
}

const subscribers = new Set<Subscriber<Event>>
window.electronAPI.onMessage(msg => {
    subscribers.values().forEach(s => s.next(msg as Event))
})

const message$ = new Observable<Event>(subscriberToSet => {
    subscribers.add(subscriberToSet)
    return () => subscribers.delete(subscriberToSet)
})

export const copyProgressEvents$ = message$.pipe(filter(n => n.cmd == "CopyProgress")).pipe(map(n => n.msg as CopyProgress))
const exifStartEvents$ = message$.pipe(filter(n => n.cmd == "ExifStart"))
const exifStopEvents$ = message$.pipe(filter(n => n.cmd == "ExifStop"))
const exifDataEvents$ = message$.pipe(filter(n => n.cmd == "Exif"))

export const exifDataEventsLeft$ = exifDataEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as ExifDataType))

export const exifDataEventsRight$ = exifDataEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as ExifDataType))

export const exifStartEventsLeft$ = exifStartEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as ExifStatus))

export const exifStartEventsRight$ = exifStartEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as ExifStatus))

export const exifStopEventsLeft$ = exifStopEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as ExifStatus))

export const exifStopEventsRight$ = exifStopEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as ExifStatus))
