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
}

type HostObjects = {
    Callback: Callback
}

type Callback = {
    DragStart: (items: string)=>Promise<boolean>
}
 
export { };