import { Observable } from 'rxjs'

export const message$ = new Observable<unknown>(subscriber => {
    window.electronAPI.onMessage(msg => subscriber.next(msg))
    // optional cleanup code
    return () => {
        console.log("unsubscribed from electron main")
    }
})

