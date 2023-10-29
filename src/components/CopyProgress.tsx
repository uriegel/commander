import { useEffect, useState } from "react"
import { progressChangedEvents } from "../requests/events"
import "./CopyProgress.css"

const CopyProgress = () => {

    const [totalCount, setTotalCount] = useState(0)
    const [currentCount, setCurrentCount] = useState(0)
    const [value, setValue] = useState(0)
    const [max, setMax] = useState(0)
    const [totalValue, setTotalValue] = useState(0)
    const [totalMax, setTotalMax] = useState(0)
    const [fileName, setFileName] = useState("")

    useEffect(() => {
        const subscription = progressChangedEvents.subscribe(e => {
            setTotalCount(e.totalCount)
            setCurrentCount(e.currentCount)
            setMax(e.totalFileBytes)
            setValue(e.currentFileBytes)
            setTotalMax(e.totalBytes)
            setTotalValue(e.currentBytes)
            setFileName(e.fileName)
        })
        return () => subscription.unsubscribe()
	}, [])

    return (
        <div className='copyProgress'>
            <p>{fileName}</p>
            <p className="rightAligned">{`${currentCount}/${totalCount}`}</p>
            <progress className='currentProgress' max={max} value={value}></progress>
            <p>Gesamt:</p>
            <progress className='totalProgress' max={totalMax} value={totalValue}></progress>
        </div>
    )
}

export default CopyProgress