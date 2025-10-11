const registeredSinks = new Set<string>()

let callback : (msg: unknown)=>void = m => {}

export function registerEvents(id: string, callbackToSet : (msg: unknown)=>void) {
    callback = callbackToSet
    if (!registeredSinks.has(id)) {
        registeredSinks.add(id)
        window.electronAPI.onMessage(msg => callback(msg))
    }
}

