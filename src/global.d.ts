export { };
    
declare global {
    interface Window {
        chrome: {
            webview: Webview
        }
    }
}

type Webview = {
    hostObjects: HostObjects
    postMessageWithAdditionalObjects: (msg: string, files: string[]) => void
    addEventListener: (name: string, handler: (e: FilesEvent)=>void) => void
    removeEventListener: (name: string, handler: (e: FilesEvent)=>void) => void
}

type HostObjects = {
    Callback: Callback
}

type Callback = {
    DragStart: (items: string)=>Promise<boolean>
}

export type FilesEvent = {
    data: string[]
}

export { };