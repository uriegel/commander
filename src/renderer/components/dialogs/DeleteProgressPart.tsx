import { useEffect, useRef, useState } from "react"
import "./ProgressPart.css"
import { ExtensionProps } from "web-dialog-react"
import ProgressBar from "../ProgressBar"
import { deleteProgressEvents$, deleteStopEvents$ } from "@/renderer/requests/events"
import { ProgressProps } from "../Statusbar"

const secondsToTime = (timeInSecs: number) => {
    const secs = timeInSecs % 60
    const min = Math.floor(timeInSecs / 60)
    return `${min.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const DeleteProgressPart = ({ props, close }: ExtensionProps) => {
    const [totalCount, setTotalCount] = useState(0)
    const [currentCount, setCurrentCount] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [remainingTime, setRemainingTime] = useState(0)
    const [fileName, setFileName] = useState("")
    const files = useRef<string[]>(null)
    const timerHandle = useRef(0)
    const idx = useRef(-1)

    useEffect(() => {
        const cpp = props as ProgressProps 
        if (files.current == null) {
            files.current = cpp.items
            setTotalCount(files.current.length)
        }
        if (cpp.index != idx.current) {
            idx.current = cpp.index
            setCurrentCount(idx.current + 1)
            setFileName(files.current[idx.current])
        }
        const subscription = deleteProgressEvents$.subscribe(e => {
            if (files.current == null) {
                files.current = props as string[]
                setTotalCount(files.current.length)
            }
            if (e.idx != idx.current && e.idx < e.totalCount) {
                idx.current = e.idx
                setCurrentCount(idx.current +1)
                setFileName(files.current[idx.current])
            }
        })
        return () => subscription.unsubscribe()
    }, [props])
    
    useEffect(() => {
        const cpp = props as ProgressProps
        timerHandle.current = setInterval(() => {
            setCurrentTime(Math.floor((new Date().getTime() - cpp.progressStartTime.getTime()) / 1000))
            setRemainingTime(totalCount ? Math.floor(currentTime * totalCount / currentCount) - currentTime : 0)
// eslint-disable-next-line @typescript-eslint/no-explicit-any            
        }) as any
        return () => clearInterval(timerHandle.current)
    }, [props, currentTime, currentCount, totalCount])

    useEffect(() => {
        const sub = deleteStopEvents$.subscribe(() => {
            clearInterval(timerHandle.current)
            setTimeout(close, 5000)
        })
        return () => sub.unsubscribe()
    })

    return (
        <div className='progress'>
            <div className="p">
                <table>
                    <tbody>
                        <tr>
                            <td>{fileName}</td>
                            <td className="rightAligned">{`${currentCount}/${totalCount}`}</td>
                        </tr>
                        <tr>
                            <td>Dauer:</td>
                            <td className="rightAligned">{secondsToTime(currentTime)}</td>
                        </tr>
                        <tr>
                            <td>Geschätzte Restdauer:</td>
                            <td className="rightAligned">{secondsToTime(remainingTime)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <ProgressBar value={currentCount/totalCount} />
        </div>
    )
}

export default DeleteProgressPart