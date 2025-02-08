import { Progress } from "./requests/events"

export declare type WebViewType = {
    initializeCustomTitlebar: () => void,
    showDevTools: () => void,
    startDragFiles: (files: string[]) => Promise<void>,
    request: <T, TR>(method: string, data: T) => Promise<TR>
    dropFiles: (id: string, move: boolean, droppedFiles: string[]) => void,
    setDroppedFilesEventHandler: (success: boolean) => void
    closeWindow(): () => void
    filesDropped: (dataTransfer: DataTransfer) => Promise<string[]>
}

export declare type WebViewEvents = {
    registerShowHidden: (fun: (show: boolean) => void) => void
    registerShowPreview: (fun: (show: boolean) => void) => void
    registerMenuAction: (fun: (cmd: string) => Promise<void>) => void
    registerProgresses: (fun: (p: Progress)=>void) => void
}