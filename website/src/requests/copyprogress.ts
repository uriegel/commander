import { BehaviorSubject } from "rxjs"
import { ProgressBytes, ProgressFile, ProgressStart } from "./events"

export const progressStartEvents = new BehaviorSubject<ProgressStart>({ kind: "start", totalFiles: 0, totalSize: 0, isMove: false })
export const progressFileEvents = new BehaviorSubject<ProgressFile>({ kind: "file", currentBytes: 0, currentFile: 0, fileName: "" })
export const progressBytesEvents = new BehaviorSubject<ProgressBytes>({
    kind: "bytes", currentBytes: 0, totalBytes: 0, completeTotalBytes: 0, completeCurrentBytes: 0, totalSeconds: 0
})
