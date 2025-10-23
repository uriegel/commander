import { useEffect, useState } from "react"
import "./CopyProgressPart.css"
import { copyProgressEvents$ } from "../../requests/events"

const secondsToTime = (timeInSecs: number) => {
    const secs = timeInSecs % 60
    const min = Math.floor(timeInSecs / 60)
    return `${min.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const CopyProgressPart = () => {

    const [totalCount, setTotalCount] = useState(0)
    const [currentCount, setCurrentCount] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [value, setValue] = useState(0)
    const [max, setMax] = useState(0)
    const [totalValue, setTotalValue] = useState(0)
    const [totalMax, setTotalMax] = useState(0)
    const [fileName, setFileName] = useState("")

    useEffect(() => {
        const subscription = copyProgressEvents$.subscribe(e => {
            //setTotalCount(e.totalBytes)
            //setCurrentCount(e.)
            //setCurrentTime(e.duration)
            setMax(e.currentMaxBytes)
            setValue(e.currentBytes)
            setTotalMax(e.totalMaxBytes)
            setTotalValue(e.totalBytes)
            //setFileName(e.name)
        })
        return () => subscription.unsubscribe()
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
                            <td>Geschätzte Restdauer:</td>
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

export default CopyProgressPart