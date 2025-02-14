import { Progress } from "./requests/events"

export declare type WebViewEvents = {
    registerShowHidden: (fun: (show: boolean) => void) => void
    registerShowPreview: (fun: (show: boolean) => void) => void
    registerMenuAction: (fun: (cmd: string) => Promise<void>) => void
    registerProgresses: (fun: (p: Progress)=>void) => void
}