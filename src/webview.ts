export const dragStart = (path: string, fileList: string[]) => 
    window.chrome.webview.hostObjects.Callback.DragStart(JSON.stringify({path, fileList}))



