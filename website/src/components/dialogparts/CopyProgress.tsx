import { useEffect, useState } from "react"
import "./CopyProgress.css"
import { fileProgress, startProgress } from "../../requests/events"

const secondsToTime = (timeInSecs: number) => {
    const secs = timeInSecs % 60
    const min = Math.floor(timeInSecs / 60)
    return `${min.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const CopyProgress = () => {
// TODO get all progresses from parent, here no subscriptions
    const [totalCount, setTotalCount] = useState(0)
    const [currentCount, setCurrentCount] = useState(0)
    const [currentTime, _setCurrentTime] = useState(0)
    const [value, _setValue] = useState(0)
    const [max, _setMax] = useState(0)
    const [totalValue, setTotalValue] = useState(0)
    const [totalMax, setTotalMax] = useState(0)
    const [fileName, setFileName] = useState("")

    useEffect(() => {
        const startSubscription = startProgress.subscribe(e => {
            console.log("WaRUN?", e)
            setTotalCount(e.totalFiles)
            setTotalMax(e.totalSize)
        })
        const fileSubscription = fileProgress.subscribe(e => {
            setFileName(e.fileName)
            setCurrentCount(e.currentFile)
            setTotalValue(e.currentBytes)
    //         setCurrentTime(e.copyTime)
    //         setMax(e.totalFileBytes)
    //         setValue(e.currentFileBytes)
    //         setTotalValue(e.currentBytes)
        })
        return () => {
            startSubscription.unsubscribe()
            fileSubscription.unsubscribe()
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
                            <td>Geschätzte Dauer:</td>
                            <td className="rightAligned">{secondsToTime(Math.floor(currentTime * totalMax / totalValue))}</td>
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