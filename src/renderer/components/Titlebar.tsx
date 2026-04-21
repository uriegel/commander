import { JSX, useEffect, useState } from "react"
import './Titlebar.css'
import { closeWindow, maximize, minimize, restore } from "../requests/requests"
import { windowStateEvents$ } from "../requests/events"

interface TitlebarProps {
    menu: JSX.Element
}

const Titlebar = ({ menu }: TitlebarProps) => {
    const onClose = () => closeWindow()
    const onMinimize = () => minimize()
    const onMaximize = () => maximize()
    const onRestore = () => restore()
    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => {
        const stateChanges = windowStateEvents$.subscribe(maximized => setIsMaximized(maximized))
        return () => stateChanges.unsubscribe()
    }, [])
        
    return (<div className="titlebar">
        <img alt="" src={`http://localhost:8080/icon/kirk`} />
        {menu}
        <div className="titlebarGrip">
            <span>Commander</span>
        </div>
        <div className="control" onClick={onMinimize}>—</div>
        <div className={`control${isMaximized ? " invisible" : ""}`} onClick={onMaximize}>🗖</div>
        <div className={`control${isMaximized ? "" : " invisible"}`} onClick={onRestore}>🗗</div>
        <div className="control close" onClick={onClose}>✕</div>
    </div>)
}

export default Titlebar