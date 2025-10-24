import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import Pie from 'react-progress-control'
import './Statusbar.css'
import { copyProgressEvents$, copyProgressShowDialogEvents$, copyStopEvents$ } from "../requests/events"
import { DialogContext, ResultType } from 'web-dialog-react'
import CopyProgressPart, { CopyProgressProps } from './dialogs/CopyProgressPart'
import './dialogs/CopyProgressPart.css'
import { cancelCopy } from '../requests/requests'

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
    const [progressMove, setProgressMove] = useState(false)
    const [progressTotalMaxBytes, setProgresstotalMaxBytes] = useState(0)
    const progressTimeout = useRef(0)
    const progressFiles = useRef<string[]>([])    
    const progressFilesIndex = useRef(-1)    
    const dialog = useContext(DialogContext)

    const dialogOpen = useRef(false)

    const startProgressDialog = useCallback(() => {
        const start = async () => {
            dialogOpen.current = true
            const res = await dialog.show({
                text: `Fortschritt beim ${progressMove ? "Verschieben" : "Kopieren"} (${progressTotalMaxBytes.byteCountToString()})`,
                btnCancel: true,
                btnOk: true,
                btnOkText: "Stoppen",
                extension: CopyProgressPart,
                extensionProps: {items: progressFiles.current, index: progressFilesIndex.current } as CopyProgressProps
             })
            dialogOpen.current = false
            if (res?.result == ResultType.Ok)
                await cancelCopy()
        }

        start()
    }, [dialog, progressMove, progressTotalMaxBytes])    

    useEffect(() => {
        const sub = copyProgressEvents$.subscribe(msg => {
            if (msg.currentBytes == 0 && msg.totalBytes == 0) {
                if (progressTimeout.current)
                    clearTimeout(progressTimeout.current)
                setProgressMove(msg.move == true)
                setProgresstotalMaxBytes(msg.totalMaxBytes)
                setBackgroundAction(true)
                setProgressRevealed(true)
                setProgressFinished(false)
                if (msg.items != undefined)
                    progressFiles.current = msg.items
            }
            progressFilesIndex.current = msg.idx
            setProgress((msg.totalBytes) / msg.totalMaxBytes)
        })
        return () => sub.unsubscribe()
    }, [setBackgroundAction])

    useEffect(() => {
        const sub = copyProgressShowDialogEvents$.subscribe(() => startProgressDialog())
        return () => sub.unsubscribe()
    })

    useEffect(() => {
        const sub = copyStopEvents$.subscribe(() => {
            setProgressFinished(true)
            setBackgroundAction(false)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            progressTimeout.current = setTimeout(() => setProgressRevealed(false), 5000) as any 
            progressFiles.current = []
        })
        return () => sub.unsubscribe()
    })

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
                    {(window.env.platform != 'win32')
                    ? (<div className={`pieContainer${progressRevealed ? " revealed" : ""}${progressFinished ? " finished" : ""}`} onClick={startProgressDialog} >
                        <Pie progress={progress} />
                        </div>)
                    : <></>}
                    <span>{`${dirCount} Verz.`}</span>
                    <span className='lastStatus'>{`${fileCount} Dateien`}</span>
                </>)}
        </div>
    )
}

export default Statusbar