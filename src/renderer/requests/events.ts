import { filter, map, Observable } from 'rxjs'
import { ID_LEFT, ID_RIGHT } from '../components/Commander'

export type ExifData = {
    idx: number,
    dateTime?: number,
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

const message$ = new Observable<Event>(subscriber => {
    window.electronAPI.onMessage(msg => subscriber.next(msg as Event))
    // optional cleanup code
    return () => {
        console.log("unsubscribed from electron main")
    }
})

const exifDataEvents$ = message$.pipe(filter(n => n.cmd == "Exif"))

export const exifDataEventsLeft$ = exifDataEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as ExifDataType))

export const exifDataEventsRight$ = exifDataEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as ExifDataType))
