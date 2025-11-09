import { useEffect, useRef, useState } from "react"
import "./CopyProgressPart.css"
import { copyProgressEvents$, copyStopEvents$ } from "../../requests/events"
import { ExtensionProps } from "web-dialog-react"

const secondsToTime = (timeInSecs: number) => {
    const secs = timeInSecs % 60
    const min = Math.floor(timeInSecs / 60)
    return `${min.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export type CopyProgressProps = {
    items: string[],
    index: number
    progressStartTime: Date
}

const CopyProgressPart = ({ props, close }: ExtensionProps) => {
    const [totalCount, setTotalCount] = useState(0)
    const [currentCount, setCurrentCount] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [remainingTime, setRemainingTime] = useState(0)
    const [value, setValue] = useState(0)
    const [max, setMax] = useState(0)
    const [totalValue, setTotalValue] = useState(0)
    const [totalMax, setTotalMax] = useState(0)
    const [fileName, setFileName] = useState("")
    const files = useRef<string[]>(null)
    const timerHandle = useRef(0)
    const idx = useRef(-1)

    useEffect(() => {
        const cpp = props as CopyProgressProps 
        if (files.current == null) {
            files.current = cpp.items
            setTotalCount(files.current.length)
        }
        if (cpp.index != idx.current) {
            idx.current = cpp.index
            setCurrentCount(idx.current + 1)
            setFileName(files.current[idx.current])
        }
        const subscription = copyProgressEvents$.subscribe(e => {
            if (files.current == null) {
                files.current = props as string[]
                setTotalCount(files.current.length)
            }
            if (e.idx != idx.current) {
                idx.current = e.idx
                setCurrentCount(idx.current +1)
                setFileName(files.current[idx.current])
            }

            setMax(e.currentMaxBytes)
            setValue(e.currentBytes)
            setTotalMax(e.totalMaxBytes)
            setTotalValue(e.totalBytes)
        })
        return () => subscription.unsubscribe()
    }, [props])
    
    useEffect(() => {
        const cpp = props as CopyProgressProps
        timerHandle.current = setInterval(() => {
            setCurrentTime(Math.floor((new Date().getTime() - cpp.progressStartTime.getTime()) / 1000))
            setRemainingTime(totalValue ? Math.floor(currentTime * totalMax / totalValue) - currentTime : 0)
// eslint-disable-next-line @typescript-eslint/no-explicit-any            
        }) as any
        return () => clearInterval(timerHandle.current)
    }, [props, totalMax, totalValue, currentTime])

    useEffect(() => {
        const sub = copyStopEvents$.subscribe(() => {
            clearInterval(timerHandle.current)
            setTimeout(close, 5000)
        })
        return () => sub.unsubscribe()
    })

    return (
        <div className='copyProgress'>
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
            <progress className='currentProgress' max={max} value={value}></progress>
            <p>Gesamt:</p>
            <progress className='totalProgress' max={totalMax} value={totalValue}></progress>
        </div>
    )
}

export default CopyProgressPart