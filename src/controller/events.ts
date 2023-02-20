import { filter, fromEvent, map } from 'rxjs'

type EventThemeChanged = {
    Case: "ThemeChanged",
    Fields: string[1]
}

type EventNothing = {
    Case: "Nothing"
}

type CommanderEvent = 
| EventNothing
| EventThemeChanged
// | EventMaximize
// | EventUnmaximize
// | EventFullScreen
// | RenameRemoteType
// | DeleteRemotesType

const toCommanderEvent = (event: MessageEvent) => 
JSON.parse(event.data) as CommanderEvent

const source = new EventSource("http://localhost:20000/commander/sse")
let commanderEvents = fromEvent<MessageEvent>(source, 'message')
    .pipe(map(toCommanderEvent))

export const themeChangedEvents = commanderEvents
    .pipe(filter(n => n.Case == "ThemeChanged"))
    .pipe(map(n => (n as EventThemeChanged).Fields[0]))

