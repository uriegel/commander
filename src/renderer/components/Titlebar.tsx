import { forwardRef, JSX, useImperativeHandle } from "react"
import './Titlebar.css'

interface TitlebarProps {
    menu: JSX.Element
}

export type TitlebarHandle = {
    
}

const Titlebar = forwardRef<TitlebarHandle, TitlebarProps>(({ menu }, ref) => {
    
    useImperativeHandle(ref, () => ({
    }))

    return (
        <div className="titlebar">
            <img alt="" src={`http://localhost:20000/windowicon`} />
            {menu}
            <div className="titlebarGrip" id="$DRAG_REGION$">
                <span id="$TITLE$"></span>
            </div>
            <div className="titlebarButton" id="$MINIMIZE$"><span className="dash">&#x2012;</span></div>
            <div className="titlebarButton" id="$RESTORE$"><span>&#10697;</span></div>  
            <div className="titlebarButton" id="$MAXIMIZE$"><span>&#9744;</span></div>
            <div className={"titlebarButton close"} id="$CLOSE$"><span>&#10005;</span></div>
            
            </div>)
})

export default Titlebar