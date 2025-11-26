import { filter, interval, merge, Observable, Subscriber, throttle } from "rxjs"
import { sendEvent } from './main.js'
import { CopyProgress, DeleteProgress } from './events.js'
import { setClosePrevent } from "./close-control.js"
import { delayAsync } from "functional-extensions"

export const withCopyProgress = async (items: string[], totalMaxBytes: number, move: boolean,
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
        
    } finally {
        sendEvent({ cmd: 'CopyStop', msg: {} })
        setClosePrevent(false)
    }
}

export const deleteCancel = () => deleteWorking = false

export const withDeleteProgress = async (items: string[], del: (file: string)=>Promise<void>) => {
    if (items.length == 0)
        return
    
    setClosePrevent(true)
    deleteWorking = true

    const subscribers = new Set<Subscriber<DeleteProgress>>
    const message$ = new Observable<DeleteProgress>(subscriberToSet => {
        subscribers.add(subscriberToSet)
        return () => subscribers.delete(subscriberToSet)
    })
    const progress$ = message$.pipe(filter(n => n.idx != n.totalCount)).pipe(throttle(() => interval(40)))
    const progressEnd$ = message$.pipe(filter(n => n.idx == n.totalCount))
    merge(progress$, progressEnd$).subscribe(msg => sendEvent({ cmd: 'DeleteProgress', msg })) 

    let currentIndex = 0
    subscribers.values().forEach(s => s.next({ idx: 0, totalCount: 0, items: items.map(n => n.getFileName()) }))
    try {
        for (let n of items) {
            if (!deleteWorking)
                break
            await del(n)
            const idx = ++currentIndex
            subscribers.values().forEach(s => s.next({ idx, totalCount: items.length }))
        }
    } finally {
        sendEvent({ cmd: 'DeleteStop', msg: {} })
        setClosePrevent(false)
        deleteWorking = false
    }
}

let deleteWorking = false