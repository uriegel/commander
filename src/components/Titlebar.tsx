import { useEffect } from "react"
import { isWindows } from "../globals"
import './Titlebar.css'
import { windowStateChangedEvents } from "../requests/events"

// TODO in webview.d.ts
declare const webViewMinimize: () => void
declare const webViewRestore: () => void
declare const webViewMaximize: () => void

interface TitlebarProps {
    menu: JSX.Element
}

const Titlebar = ({ menu }: TitlebarProps) => {
    
    useEffect(() => {
		windowStateChangedEvents.subscribe(maximized => console.log("Status geändert", maximized))
    }, [])
    
    const onMinimize = () => webViewMinimize()
    const onRestore = () => webViewRestore()
    const onMaximize = () => webViewMaximize()
    const onClose = () => window.close()
    
    return  isWindows()        
        ? (<div className="titlebar">
                <div>Test</div>
                {menu}
                <div className="titlebarGrip">
                    <span>Commander</span>
                </div>
                <div className="titlebarButton" onClick={onMinimize}><span className="dash">&#x2012;</span></div>
                <div className="titlebarButton" onClick={onMaximize}><span>&#9744;</span></div>                
                <div className="titlebarButton" onClick={onRestore}><span>&#10697;</span></div>                
                <div className={"titlebarButton close"} onClick={onClose}><span>&#10005;</span></div>
            
            </div>)
        : menu
}

export default Titlebar