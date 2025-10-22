import { filter, interval, merge, Observable, Subscriber, throttle } from "rxjs"
import { sendEvent } from './index.js'
import { CopyProgress } from './events.js'
import { copyFiles } from "filesystem-utilities"

export const copyItems = async (requestId: number, sourcePath: string, targetPath: string, items: string[], move: boolean) => {
    const subscribers = new Set<Subscriber<CopyProgress>>
    const message$ = new Observable<CopyProgress>(subscriberToSet => {
        subscribers.add(subscriberToSet)
        return () => subscribers.delete(subscriberToSet)
    })
    const progress$ = message$.pipe(filter(n => n.total != n.current)).pipe(throttle(() => interval(40)))
    const progressEnd$ = message$.pipe(filter(n => n.total == n.current))

    merge(progress$, progressEnd$).subscribe(msg => sendEvent({ cmd: 'CopyProgress', msg })) 

    subscribers.values().forEach(s => s.next({idx: 0, current: 0, total: -1}))
    await copyFiles(sourcePath, targetPath, items, {
        move, overwrite: true, progressCallback: (idx: number, current: number, total: number) => 
            subscribers.values().forEach(s => s.next({idx, current, total}))
    })
}