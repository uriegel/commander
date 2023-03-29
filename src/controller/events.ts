import { BehaviorSubject, filter, fromEvent, map } from 'rxjs'

type CopyProgress = {
    fileName: string
    totalFileBytes: number
    currentFileBytes: number
}

type CommanderEvent = {
    theme?:        string
    copyProgress?: CopyProgress
}

const toCommanderEvent = (event: MessageEvent) => 
JSON.parse(event.data) as CommanderEvent

const source = new EventSource("http://localhost:20000/commander/sse")
let commanderEvents = fromEvent<MessageEvent>(source, 'message')
    .pipe(map(toCommanderEvent))

export const themeChangedEvents = commanderEvents
    .pipe(filter(n => n.theme != undefined))
    .pipe(map(n => n.theme!))

export const progressChangedEvents = new BehaviorSubject<CopyProgress>({fileName: "", totalFileBytes: 0, currentFileBytes: 0})

commanderEvents
    .pipe(filter(n => n.copyProgress != undefined))
    .pipe(map(n => n.copyProgress!))
    .subscribe(progressChangedEvents)
