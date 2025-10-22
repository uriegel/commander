import { useEffect, useRef, useState } from 'react'
import Pie from 'react-progress-control'
import './StatusBar.css'
import { copyProgressEvents$ } from "../requests/events"

export interface StatusbarProps {
    path: string
    dirCount: number
    fileCount: number
    errorText: string | null
    setErrorText: (text: string | null) => void
    statusText?: string
    statusInfo?: string
    setBackgroundAction: (set: boolean) => void
}

const Statusbar = ({ path, dirCount, fileCount, errorText, setErrorText, statusText, statusInfo, setBackgroundAction }: StatusbarProps) => {

    const timer = useRef(0)

    useEffect(() => {
        if (errorText) {
            clearTimeout(timer.current)
            timer.current = setTimeout(() => setErrorText(null), 5000) as unknown as number           
        }
    }, [errorText, setErrorText])

    const [progress, setProgress] = useState(0)
    const [progressRevealed, setProgressRevealed] = useState(false)
    const [progressFinished, setProgressFinished] = useState(false)
    const progressTimeout = useRef(0)

    useEffect(() => {
        const sub = copyProgressEvents$.subscribe(msg => {
            //setProgress((copyProgress.totalBytes + copyProgress.currentBytes) / copyProgress.totalMaxBytes)
            if (msg.current == 0) {
                if (progressTimeout.current)
                    clearTimeout(progressTimeout.current)
                setBackgroundAction(true)
                setProgressRevealed(true)
                setProgressFinished(false)
            }
            else if (msg.current == msg.total) {
                setProgressFinished(true)
                setBackgroundAction(false)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                progressTimeout.current = setTimeout(() => setProgressRevealed(false), 5000) as any 
            }
            setProgress((msg.current) / msg.total)
        })
        return () => sub.unsubscribe()
    }, [setBackgroundAction])

    const getClasses = () => ["statusbar", errorText
                                            ? "error"
                                            : statusInfo
                                            ? "info"
                                            : statusText
                                            ? "status"
                                            : null]
        .join(' ')
    
    // onClick={startProgressDialog}
    
    return (
        <div className={getClasses()}>
            { errorText
                || statusInfo
                || (<>
                    <span>{statusText || path}</span>
                    <span className='fill'></span>
                    <div className={`pieContainer${progressRevealed ? " revealed" : ""}${progressFinished ? " finished" : ""}`} > 
                        <Pie progress={progress}/>
                    </div>  
                    <span>{`${dirCount} Verz.`}</span>
                    <span className='lastStatus'>{`${fileCount} Dateien`}</span>
                </>)}
        </div>
    )
}

export default Statusbar