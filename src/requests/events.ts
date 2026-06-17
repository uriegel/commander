import { filter, map, Observable, Subject, Subscriber } from 'rxjs'
import { ID_LEFT, ID_RIGHT } from '../components/Commander'
import {
    type ChangeEvent,
    type CmdEvent, type CommanderEvent, type CopyProgress, type CreateEvent, type DeleteEvent, type DeleteProgress, type ExtendedInfos, type ExtendedInfosStatus,
    type PreviewModeEvent, type RenameEvent, type ShowHiddenEvent, type ShowViewerEvent, type ThemeChangeEvent, type WindowStateEvent
} from './model'

const eventSubject = new Subject<CommanderEvent>()

window.onEvent = (json: string) => {
    const cmd = JSON.parse(json) as CommanderEvent
    eventSubject.next(cmd)
}
const $wsToEventObservable = eventSubject.asObservable()

//$wsToEventObservable.subscribe(msg => console.log("event", msg))
$wsToEventObservable.subscribe(msg => subscribers.forEach(s => s.next(msg)))

const subscribers = new Set<Subscriber<CommanderEvent>>

const message$ = new Observable<CommanderEvent>(subscriberToSet => {
    subscribers.add(subscriberToSet)
    return () => subscribers.delete(subscriberToSet)
})

export const copyProgressEvents$ = message$.pipe(filter(n => n.cmd == "CopyProgress")).pipe(map(n => n.msg as CopyProgress))
export const copyProgressShowDialogEvents$ = message$.pipe(filter(n => n.cmd == "CopyProgressShowDialog"))
export const deleteProgressEvents$ = message$.pipe(filter(n => n.cmd == "DeleteProgress")).pipe(map(n => n.msg as DeleteProgress))
export const deleteStopEvents$ = message$.pipe(filter(n => n.cmd == "DeleteStop"))
export const copyStopEvents$ = message$.pipe(filter(n => n.cmd == "CopyStop"))
export const cmdEvents$ = message$.pipe(filter(n => n.cmd == "Cmd")).pipe(map(n => (n.msg as CmdEvent).cmd))
export const themeChangedEvents$ = message$.pipe(filter(n => n.cmd == "ThemeChanged")).pipe(map(n => (n.msg as ThemeChangeEvent).accentColor))
export const windowStateEvents$ = message$.pipe(filter(n => n.cmd == "WindowState")).pipe(map(n => (n.msg as WindowStateEvent).maximized))
export const showHiddenEvents$ = message$.pipe(filter(n => n.cmd == "ShowHidden")).pipe(map(n => (n.msg as ShowHiddenEvent).showHidden))
export const showViewerEvents$ = message$.pipe(filter(n => n.cmd == "ShowViewer")).pipe(map(n => (n.msg as ShowViewerEvent).showViewer))
export const PreviewModeEvents$ = message$.pipe(filter(n => n.cmd == "PreviewMode")).pipe(map(n => (n.msg as PreviewModeEvent).previewMode))
export const refreshDrivesEvents$ = message$.pipe(filter(n => n.cmd == "RefreshDrives"))
const renameEvents$ = message$.pipe(filter(n => n.cmd == "Rename")).pipe(map(n => (n.msg as RenameEvent).renameData))
const deleteEvents$ = message$.pipe(filter(n => n.cmd == "Delete")).pipe(map(n => (n.msg as DeleteEvent).deleteData))
const createEvents$ = message$.pipe(filter(n => n.cmd == "Create")).pipe(map(n => (n.msg as CreateEvent).createData))
const changeEvents$ = message$.pipe(filter(n => n.cmd == "Change")).pipe(map(n => (n.msg as ChangeEvent).createData))
const extendedInfosStartEvents$ = message$.pipe(filter(n => n.cmd == "ExtendedInfosStart"))
const extendedInfosStopEvents$ = message$.pipe(filter(n => n.cmd == "ExtendedInfosStop"))
const extendedInfosEvents$ = message$.pipe(filter(n => n.cmd == "ExtendedInfos"))

renameEvents$.subscribe(_ => console.log("rename"))
deleteEvents$.subscribe(_ => console.log("delete"))
createEvents$.subscribe(_ => console.log("create"))
changeEvents$.subscribe(_ => console.log("change"))

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

export const renameEventsLeft$ = renameEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))

export const renameEventsRight$ = renameEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))
    
export const deleteEventsLeft$ = deleteEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))

export const deleteEventsRight$ = deleteEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))

export const createEventsLeft$ = createEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))

export const createEventsRight$ = createEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))

export const changeEventsLeft$ = changeEvents$
    .pipe(filter(n => n.folderId == ID_LEFT))

export const changeEventsRight$ = changeEvents$
    .pipe(filter(n => n.folderId == ID_RIGHT))

