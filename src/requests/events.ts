import { BehaviorSubject, filter, fromEvent, map } from 'rxjs'

type CopyProgress = {
    fileName: string
    totalCount: number
    currentCount: number,
    totalFileBytes: number
    currentFileBytes: number
    totalBytes: number
    currentBytes: number
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

export const progressChangedEvents = new BehaviorSubject<CopyProgress>({
    fileName: "",
    totalCount: 0,
    currentCount: 0,
    totalFileBytes: 0,
    currentFileBytes: 0,
    totalBytes: 0,
    currentBytes: 0
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
