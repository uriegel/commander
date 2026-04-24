import { filter, fromEvent, map, merge, Observable, Subscriber } from 'rxjs'
import { ID_LEFT, ID_RIGHT } from '../components/Commander'
import { CommanderEvent, CopyProgress, DeleteProgress, ExifData, ExifDataType, ExifStatus, ShowHiddenEvent, ThemeChangeEvent, Version, WindowStateEvent } from './model'
//import { VersionInfoResult } from 'native'

let ws = new WebSocket("ws://localhost:8080/events")

const $wsToEventObservable = fromEvent(ws, 'message').pipe(map(n => {
    const evt = n as MessageEvent
    return JSON.parse(evt.data) as CommanderEvent
}))

$wsToEventObservable.subscribe(msg => subscribers.values().forEach(s => s.next(msg)))

const subscribers = new Set<Subscriber<CommanderEvent>>

const message$ = new Observable<CommanderEvent>(subscriberToSet => {
    subscribers.add(subscriberToSet)
    return () => subscribers.delete(subscriberToSet)
})

export const copyProgressEvents$ = message$.pipe(filter(n => n.cmd == "CopyProgress")).pipe(map(n => n.msg as CopyProgress))
export const copyProgressShowDialogEvents$ = message$.pipe(filter(n => n.cmd == "CopyProgressShowDialog"))
export const deleteProgressEvents$ = message$.pipe(filter(n => n.cmd == "DeleteProgress")).pipe(map(n => n.msg as DeleteProgress))
//export const copyProgressShowDialogEvents$ = message$.pipe(filter(n => n.cmd == "CopyProgressShowDialog"))
export const deleteStopEvents$ = message$.pipe(filter(n => n.cmd == "DeleteStop"))
export const copyStopEvents$ = message$.pipe(filter(n => n.cmd == "CopyStop"))
export const themeChangedEvents$ = message$.pipe(filter(n => n.cmd == "ThemeChanged")).pipe(map(n => (n.msg as ThemeChangeEvent).accentColor))
export const windowStateEvents$ = message$.pipe(filter(n => n.cmd == "WindowState")).pipe(map(n => (n.msg as WindowStateEvent).maximized))
export const showHiddenEvents$ = message$.pipe(filter(n => n.cmd == "ShowHidden")).pipe(map(n => (n.msg as ShowHiddenEvent).showHidden))
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


