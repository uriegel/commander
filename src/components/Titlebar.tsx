import { useEffect, useState } from "react"
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

// TODO When maximized, no border correction is needed
// TODO Icon from resource
// TODO Menu hide menu item (separator)

const Titlebar = ({ menu }: TitlebarProps) => {
    
    const [isMaximized, setIsMaximized] = useState(false)
    
    useEffect(() => {
		windowStateChangedEvents.subscribe(maximized => console.log(setIsMaximized(maximized)))
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
                {
                    isMaximized
                    ? (<div className="titlebarButton" onClick={onRestore}><span>&#10697;</span></div>)
                    : (<div className="titlebarButton" onClick={onMaximize}><span>&#9744;</span></div>)
                }
                <div className={"titlebarButton close"} onClick={onClose}><span>&#10005;</span></div>
            
            </div>)
        : menu
}

export default Titlebar