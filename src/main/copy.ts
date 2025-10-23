import { filter, interval, merge, Observable, Subscriber, throttle } from "rxjs"
import { sendEvent } from './index.js'
import { CopyProgress } from './events.js'
import { copyFiles } from "filesystem-utilities"

export const copyItems = async (requestId: number, sourcePath: string, targetPath: string, items: string[], totalBytes: number, move: boolean) => {
    if (items.length == 0)
        return
    
    const subscribers = new Set<Subscriber<CopyProgress>>
    const message$ = new Observable<CopyProgress>(subscriberToSet => {
        subscribers.add(subscriberToSet)
        return () => subscribers.delete(subscriberToSet)
    })
    const progress$ = message$.pipe(filter(n => n.totalBytes != n.copiedBytes + n.current)).pipe(throttle(() => interval(40)))
    const progressEnd$ = message$.pipe(filter(n => n.totalBytes == n.copiedBytes + n.current))

    merge(progress$, progressEnd$).subscribe(msg => sendEvent({ cmd: 'CopyProgress', msg })) 

    let previousCopiedBytes = 0
    let currentIndex = -1
    let copiedBytes = 0
    subscribers.values().forEach(s => s.next({idx: 0, current: 0, currentTotal: 0, copiedBytes, totalBytes }))
    await copyFiles(sourcePath, targetPath, items, {
        move, overwrite: true, progressCallback: (idx: number, current: number, currentTotal: number) => {
            if (currentIndex != idx) {
                copiedBytes = previousCopiedBytes
                previousCopiedBytes += currentTotal
                currentIndex = idx
            }
            console.log({ idx, current, currentTotal, copiedBytes, totalBytes })
            subscribers.values().forEach(s => s.next({ idx, current, currentTotal, copiedBytes, totalBytes }))
        }
    })
}