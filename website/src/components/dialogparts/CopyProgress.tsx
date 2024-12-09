import { useEffect, useState } from "react"
import "./CopyProgress.css"
import { progressBytesEvents, progressFileEvents, progressStartEvents } from "../../requests/copyprogress"

const secondsToTime = (timeInSecs: number) => {
    const secs = timeInSecs % 60
    const min = Math.floor(timeInSecs / 60)
    return `${min.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const CopyProgress = () => {
    const [currentTime, setCurrentTime] = useState(0)
    const [value, setValue] = useState(0)
    const [max, setMax] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [totalMax, setTotalMax] = useState(0)
    const [fileName, setFileName] = useState("")
    const [currentCount, setCurrentCount] = useState(0)
    const [totalValue, setTotalValue] = useState(0)

    useEffect(() => {
        const startEvents = progressStartEvents.subscribe(e => {
            setTotalCount(e.totalFiles)
            setTotalMax(e.totalSize)
        })
        const fileEvents = progressFileEvents.subscribe(e => {
            setFileName(e.fileName)
            setCurrentCount(e.currentFiles)
            setTotalValue(e.currentBytes)
        })
        const bytesEvents = progressBytesEvents.subscribe(e => {
            if (e.currentBytes != 0) {
                setMax(e.totalBytes)
                setValue(e.currentBytes)
                setTotalValue(e.currentBytes + e.completeCurrentBytes)
                setCurrentTime(e.totalSeconds)
            }
        })
        return () => {
            startEvents.unsubscribe()
            fileEvents.unsubscribe()
            bytesEvents.unsubscribe()
        }
    }, [])

    return (
        <div className='copyProgress'>
            <p>
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
                            <td>Geschätzte Restzeit:</td>
                            <td className="rightAligned">{secondsToTime(Math.floor(currentTime * totalMax / totalValue) - currentTime)}</td>
                        </tr>
                    </tbody>
                </table>
            </p>
            <progress className='currentProgress' max={max} value={value}></progress>
            <p>Gesamt:</p>
            <progress className='totalProgress' max={totalMax} value={totalValue}></progress>
        </div>
    )
}

export default CopyProgress