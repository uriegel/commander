import { filter, interval, merge, Observable, Subscriber, throttle } from "rxjs"
import { sendEvent } from './index.js'
import { CopyProgress } from './events.js'
import { setClosePrevent } from "./close-control.js"

export const withProgress = async (items: string[], totalMaxBytes: number, move: boolean,
    copy: (progressCallback: (idx: number, currentBytes: number, currentMaxBytes: number)=>void)=>Promise<void>) => {
    if (items.length == 0)
        return
    
    setClosePrevent(true)

    // TODO move to a different drive, flatten folders before
    // const getParentPath = (n: string) => {
    //     return n.length > 1 && (n.charAt(n.length - 1) == "/" || n.charAt(n.length - 1) == "\\")
    //         ? n.substring(0, n.substring(0, n.length - 1).lastIndexOfAny(["/", "\\"]))
    //         : n.substring(0, n.lastIndexOfAny(["/", "\\"]))
    // }

    // const deleteRecursive = (n: string) => {
    //     console.log("lösche", n)
            // g_file_delete
    //     const parent = getParentPath(n)
    //     if (parent)
    //         deleteRecursive(parent)
    // }

    // const folders = new Set<string>
    // items.forEach(n => folders.add(getParentPath(n)))
    
    // folders.forEach(deleteRecursive)
    

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
        await copy((idx: number, currentBytes: number, currentMaxBytes: number) => {
            if (currentIndex != idx) {
                copiedBytes = previousCopiedBytes
                previousCopiedBytes += currentMaxBytes
                currentIndex = idx
            }
            subscribers.values().forEach(s => s.next({ idx, currentBytes, currentMaxBytes, totalBytes: copiedBytes + currentBytes, totalMaxBytes }))
        })
        
        sendEvent({ cmd: 'CopyStop', msg: {} })
        setClosePrevent(false)
    } catch (e) {
        sendEvent({ cmd: 'CopyStop', msg: {} })
        setClosePrevent(false)
        throw e
    }
}

