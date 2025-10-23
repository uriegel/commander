import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import Pie from 'react-progress-control'
import './StatusBar.css'
import { copyProgressEvents$ } from "../requests/events"
import { DialogContext, ResultType } from 'web-dialog-react'
import CopyProgressPart from './dialogs/CopyProgressPart'
import './dialogs/CopyProgressPart.css'

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
            if (msg.currentBytes == 0 && msg.totalBytes == 0) {
                if (progressTimeout.current)
                    clearTimeout(progressTimeout.current)
                setBackgroundAction(true)
                setProgressRevealed(true)
                setProgressFinished(false)
            }
            else if (msg.totalBytes == msg.totalMaxBytes) {
                setProgressFinished(true)
                setBackgroundAction(false)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                progressTimeout.current = setTimeout(() => setProgressRevealed(false), 5000) as any 
            }
            setProgress((msg.totalBytes) / msg.totalMaxBytes)
        })
        return () => sub.unsubscribe()
    }, [setBackgroundAction])

    const dialog = useContext(DialogContext)

    const dialogOpen = useRef(false)

    const startProgressDialog = useCallback(() => {
        const start = async () => {
            dialogOpen.current = true
            const res = await dialog.show({
                //text: `Fortschritt beim ${copyProgress.move ? "Verschieben" : "Kopieren"} (${copyProgress.totalMaxBytes.byteCountToString()})`,
                text: "Das ist die Überschrift",
                btnCancel: true,
                btnOk: true,
                btnOkText: "Stoppen",
                extension: CopyProgressPart
             })
            dialogOpen.current = false
            // if (res?.result == ResultType.Ok)
            //     await cancelCopy({})
        }

        start()
    }, [dialog])    

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
                    <div className={`pieContainer${progressRevealed ? " revealed" : ""}${progressFinished ? " finished" : ""}`} onClick={startProgressDialog} > 
                        <Pie progress={progress}/>
                    </div>  
                    <span>{`${dirCount} Verz.`}</span>
                    <span className='lastStatus'>{`${fileCount} Dateien`}</span>
                </>)}
        </div>
    )
}

export default Statusbar