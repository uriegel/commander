import { filter, map, Observable, Subscriber } from 'rxjs'
import { ID_LEFT, ID_RIGHT } from '../components/Commander'
import { VersionInfoResult } from 'filesystem-utilities'

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

export type DeleteProgress = {
    idx: number,
    totalCount: number,
    items?: string[]
}

export type Version = {
    requestId: number,
    items: VersionInfoResult[]
}

type EventData = ExifDataType | ExifStatus| CopyProgress | Version | DeleteProgress

type EventCmd = "Exif" | "ExifStart" | "ExifStop" | "CopyProgress" | "CopyStop" | "CopyProgressShowDialog"
    | "VersionsStart" | "VersionsStop" | "Versions" | "ThemeChanged" | "DeleteProgress" | "DeleteStop"

type Event = {
    folderId?: string,
    cmd: EventCmd,
    msg: EventData
}

const subscribers = new Set<Subscriber<Event>>
window.electronAPI.onMessage(msg => subscribers.values().forEach(s => s.next(msg as Event)))

const message$ = new Observable<Event>(subscriberToSet => {
    subscribers.add(subscriberToSet)
    return () => subscribers.delete(subscriberToSet)
})

export const copyProgressEvents$ = message$.pipe(filter(n => n.cmd == "CopyProgress")).pipe(map(n => n.msg as CopyProgress))
export const copyProgressShowDialogEvents$ = message$.pipe(filter(n => n.cmd == "CopyProgressShowDialog"))
export const deleteProgressEvents$ = message$.pipe(filter(n => n.cmd == "DeleteProgress")).pipe(map(n => n.msg as DeleteProgress))
//export const copyProgressShowDialogEvents$ = message$.pipe(filter(n => n.cmd == "CopyProgressShowDialog"))
export const deleteStopEvents$ = message$.pipe(filter(n => n.cmd == "DeleteStop"))
export const copyStopEvents$ = message$.pipe(filter(n => n.cmd == "CopyStop"))
export const themeChangedEvents$ = message$.pipe(filter(n => n.cmd == "ThemeChanged"))
const exifStartEvents$ = message$.pipe(filter(n => n.cmd == "ExifStart"))
const exifStopEvents$ = message$.pipe(filter(n => n.cmd == "ExifStop"))
const exifDataEvents$ = message$.pipe(filter(n => n.cmd == "Exif"))
const versionsStartEvents$ = message$.pipe(filter(n => n.cmd == "VersionsStart"))
const versionsDataEvents$ = message$.pipe(filter(n => n.cmd == "Versions"))
const versionsStopEvents$ = message$.pipe(filter(n => n.cmd == "VersionsStop"))

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

export const versionsDataEventsLeft$ = versionsDataEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as Version))

export const versionsDataEventsRight$ = versionsDataEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as Version))

export const versionsStartEventsLeft$ = versionsStartEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as Version))

export const versionsStartEventsRight$ = versionsStartEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as Version))

export const versionsStopEventsLeft$ = versionsStopEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as Version))

export const versionsStopEventsRight$ = versionsStopEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as Version))
