import { filter, fromEvent, map } from 'rxjs'

type CommanderEvent = {
    theme?: string
}

const toCommanderEvent = (event: MessageEvent) => 
JSON.parse(event.data) as CommanderEvent

//const source = new EventSource("http://localhost:20000/commander/sse")
const source = new EventSource("http://localhost:19999/commander/sse")
let commanderEvents = fromEvent<MessageEvent>(source, 'message')
    .pipe(map(toCommanderEvent))

export const themeChangedEvents = commanderEvents
    .pipe(filter(n => n.theme != undefined))
    .pipe(map(n => n.theme!))

