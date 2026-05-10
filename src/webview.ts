import type { FilesEvent } from "./global"

export const dragStart = (path: string, fileList: string[]) => 
    window.chrome.webview.hostObjects.Callback.DragStart(JSON.stringify({path, fileList}))

export const resolveDroppedFiles = (fileList: FileList) => new Promise<string[]>(res => {
    const dispose = registerHostMessages(files => {
        dispose()
        res(files)
    }) 

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.chrome.webview.postMessageWithAdditionalObjects("ondrop", Array.from(fileList) as any[] as string[])
})

function registerHostMessages(callback: (files: string[])=>void) {
    const handler = (e: FilesEvent) => callback(e.data)

    window.chrome?.webview?.addEventListener("message", handler)
    return () => {
       window.chrome?.webview?.removeEventListener("message", handler);
    }
}