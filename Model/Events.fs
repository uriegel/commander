module Events
open FSharp.Collections

let mutable events = Map.empty<string, obj->unit>

let onEventSink (id: string) (sendEvent: obj->unit) = 
    events <- events |> Map.add id sendEvent
