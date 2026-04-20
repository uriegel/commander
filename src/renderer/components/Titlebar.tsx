import { JSX } from "react"
import './Titlebar.css'
import { closeWindow, maximize, minimize } from "../requests/requests"

interface TitlebarProps {
    menu: JSX.Element
}

const Titlebar = ({ menu }: TitlebarProps) => {
    const onClose = () => closeWindow()
    const onMinimize = () => minimize()
    const onMaximize = () => maximize()
    
    return (<div className="titlebar">
        <img alt="" src={`windowicon://localhost/`} />
        {menu}
        <div className="titlebarGrip">
            <span>Commander</span>
        </div>
        <div className="control" onClick={onMinimize}>—</div>
        <div className="control" onClick={onMaximize}>🗖</div>
        <div className="control" onClick={onMaximize}>🗗</div>
        <div className="control close" onClick={onClose}>✕</div>
    </div>)
}

export default Titlebar