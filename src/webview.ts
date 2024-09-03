export declare type WebViewType = {
    initializeNoTitlebar: () => void,
    showDevTools: () => void,
    startDragFiles: (files: string[]) => void,
    request: <T, TR>(method: string, data: T) => Promise<TR>
    registerEvents: <T>(id: string, onEvent: (evt: T)=>void) => void,
    dropFiles: (id: string, move: boolean, droppedFiles: string[]) => void,
    setDroppedFilesEventHandler: (success: boolean) => void
    getRequestUrl: () => string
}

