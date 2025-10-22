import { useEffect, useRef, useState } from 'react'
import Pie from 'react-progress-control'
import './StatusBar.css'
import { CopyProgress } from '@/main/events'

export interface StatusbarProps {
    path: string
    dirCount: number
    fileCount: number
    errorText: string | null
    setErrorText: (text: string | null) => void
    statusText?: string
    statusInfo?: string
    copyProgress: CopyProgress
    progressRevealed: boolean
    progressFinished: boolean
}

const Statusbar = ({ path, dirCount, fileCount, errorText, setErrorText, statusText, statusInfo, copyProgress, progressFinished, progressRevealed }: StatusbarProps) => {

    const timer = useRef(0)

    useEffect(() => {
        if (errorText) {
            clearTimeout(timer.current)
            timer.current = setTimeout(() => setErrorText(null), 5000) as unknown as number           
        }
    }, [errorText, setErrorText])

    const [progress, setProgress] = useState(0)

    useEffect(() => {
        //setProgress((copyProgress.totalBytes + copyProgress.currentBytes) / copyProgress.totalMaxBytes)
        setProgress((copyProgress.current) / copyProgress.total)
    }, [copyProgress])

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