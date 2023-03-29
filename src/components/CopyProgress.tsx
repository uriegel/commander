import { useEffect, useState } from "react"
import { progressChangedEvents } from "../controller/events"
import "./CopyProgress.css"

const CopyProgress = () => {

    const [value, setValue] = useState(0)
    const [max, setMax] = useState(0)
    const [fileName, setFileName] = useState("")

    useEffect(() => {
        const subscription = progressChangedEvents.subscribe(e => {
            setMax(e.totalFileBytes)
            setValue(e.currentFileBytes)
            setFileName(e.fileName)
        })
        return () => subscription.unsubscribe()
	}, [])

    return (
        <div className='copyProgress'>
            <p>{fileName}</p>
            <progress className='currentProgress' max={max} value={value}></progress>
            <p>Gesamt:</p>
            <progress className='totalProgress' max="0" value="0"></progress>
        </div>
    )
}

export default CopyProgress