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

type EventData = ExifDataType

type EventCmd = "Exif"

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

const exifDataEvents$ = message$.pipe(filter(n => n.cmd == "Exif"))

export const exifDataEventsLeft$ = exifDataEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as ExifDataType))

export const exifDataEventsRight$ = exifDataEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as ExifDataType))
