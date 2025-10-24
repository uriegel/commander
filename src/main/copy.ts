import { filter, interval, merge, Observable, Subscriber, throttle } from "rxjs"
import { sendEvent } from './index.js'
import { CopyProgress } from './events.js'
import { copyFiles } from "filesystem-utilities"
import { setClosePrevent } from "./close-control.js"

export const copyItems = async (requestId: number, sourcePath: string, targetPath: string, items: string[], totalMaxBytes: number, move: boolean) => {
    if (items.length == 0)
        return
    
    setClosePrevent(true)


    const subscribers = new Set<Subscriber<CopyProgress>>
    const message$ = new Observable<CopyProgress>(subscriberToSet => {
        subscribers.add(subscriberToSet)
        return () => subscribers.delete(subscriberToSet)
    })
    const progress$ = message$.pipe(filter(n => n.totalBytes != n.totalMaxBytes)).pipe(throttle(() => interval(40)))
    const progressEnd$ = message$.pipe(filter(n => n.totalBytes == n.totalMaxBytes))

    merge(progress$, progressEnd$).subscribe(msg => sendEvent({ cmd: 'CopyProgress', msg })) 

    let previousCopiedBytes = 0
    let currentIndex = -1
    let copiedBytes = 0
    subscribers.values().forEach(s => s.next({ idx: 0, currentBytes: 0, currentMaxBytes: 0, totalBytes: 0, totalMaxBytes, move, items }))
    try {
        await copyFiles(sourcePath, targetPath, items, {
            move, overwrite: true, cancellation: "copy", progressCallback: (idx: number, currentBytes: number, currentMaxBytes: number) => {
                if (currentIndex != idx) {
                    copiedBytes = previousCopiedBytes
                    previousCopiedBytes += currentMaxBytes
                    currentIndex = idx
                }
                subscribers.values().forEach(s => s.next({ idx, currentBytes, currentMaxBytes, totalBytes: copiedBytes + currentBytes, totalMaxBytes }))
            }
        })
        setClosePrevent(false)
    } catch (e) {
        setClosePrevent(false)
        throw e
    }
}