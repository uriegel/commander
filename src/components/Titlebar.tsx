import { isWindows } from "../globals"
import './Titlebar.css'
import Pie from 'react-progress-control'
import CopyProgress from "./dialogparts/CopyProgress"
import { DialogContext, ResultType } from "web-dialog-react"
import "functional-extensions"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { ErrorType, Nothing, jsonPost } from "functional-extensions"
import { progressChangedEvents, showProgressEvents } from "../requests/events"
import { closeWindow } from "../requests/requests"

declare const webViewMinimize: () => void
declare const webViewRestore: () => void
declare const webViewMaximize: () => void

interface TitlebarProps {
    menu: JSX.Element
    isMaximized: boolean
    progress: number
    progressRevealed: boolean
    totalSize: number
}

const Titlebar = ({ menu, isMaximized, progress, progressRevealed, totalSize }: TitlebarProps) => {
    
    const onMinimize = () => webViewMinimize()
    const onRestore = () => webViewRestore()
    const onMaximize = () => webViewMaximize()
    const onClose = () => closeWindow()

    const dialog = useContext(DialogContext)

    const [move, setMove] = useState(false)

    const dialogOpen = useRef(false)

    const startProgressDialog = useCallback(() => {
        const start = async () => {
            dialogOpen.current = true
            const res = await dialog.show({
                text: `Fortschritt beim ${move ? "Verschieben" : "Kopieren"} (${totalSize?.byteCountToString()})`,
                btnCancel: true,
                btnCancelText: "Abbrechen",
                btnOk: true,
                btnOkText: "Stoppen",
                defBtnCancel: true,
                extension: CopyProgress
            })
            dialogOpen.current = false
            if (res?.result == ResultType.Ok)
                jsonPost<Nothing, ErrorType>({ method: "cancelCopy" })
        }

        start()
    }, [dialog, move, totalSize])

    useEffect(() => {
        const subscription = progressChangedEvents.subscribe(e => setMove(e.isMove))
        return () => subscription.unsubscribe()
	}, [])

    useEffect(() => {
        const subscription = showProgressEvents.subscribe(() => startProgressDialog())
        return () => subscription.unsubscribe()
	}, [startProgressDialog])

    useEffect(() => {
        if (dialogOpen.current)
            dialog.close()

    }, [progressRevealed, dialog])

    return  isWindows()        
        ? (<div className="titlebar">
            <img src="http://localhost:20000/commander/getfavicon"/>
            {menu}
            <div className="titlebarGrip">
                <span>Commander</span>
            </div>
            <div className={`pieContainer${progressRevealed ? " revealed" : ""}`} onClick={startProgressDialog}>
                // TODO isFinished: gray color
                <Pie progress={progress}/>
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