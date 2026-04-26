import { filter, fromEvent, map, Observable, Subscriber } from 'rxjs'
import { ID_LEFT, ID_RIGHT } from '../components/Commander'
import { CommanderEvent, CopyProgress, DeleteProgress, ExtendedInfos, ExtendedInfosStatus, PreviewModeEvent, ShowHiddenEvent, ShowViewerEvent, ThemeChangeEvent, WindowStateEvent } from './model'

const ws = new WebSocket("ws://localhost:8080/events")

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
export const showViewerEvents$ = message$.pipe(filter(n => n.cmd == "ShowViewer")).pipe(map(n => (n.msg as ShowViewerEvent).showViewer))
export const PreviewModeEvents$ = message$.pipe(filter(n => n.cmd == "PreviewMode")).pipe(map(n => (n.msg as PreviewModeEvent).previewMode))
const extendedInfosStartEvents$ = message$.pipe(filter(n => n.cmd == "ExtendedInfosStart"))
const extendedInfosStopEvents$ = message$.pipe(filter(n => n.cmd == "ExtendedInfosStop"))
const extendedInfosEvents$ = message$.pipe(filter(n => n.cmd == "ExtendedInfos"))

export const extendedInfosEventsLeft$ = extendedInfosEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as ExtendedInfos))

export const extendedInfosEventsRight$ = extendedInfosEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as ExtendedInfos))

export const extendedInfosStartEventsLeft$ = extendedInfosStartEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as ExtendedInfosStatus))

export const extendedInfosStartEventsRight$ = extendedInfosStartEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as ExtendedInfosStatus))

export const extendedInfosStopEventsLeft$ = extendedInfosStopEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))
    .pipe(map(n => n.msg as ExtendedInfosStatus))

export const extendedInfosStopEventsRight$ = extendedInfosStopEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    .pipe(map(n => n.msg as ExtendedInfosStatus))



