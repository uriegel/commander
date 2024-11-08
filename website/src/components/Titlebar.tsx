import { isWindows } from "../globals"
import './Titlebar.css'
import Pie from 'react-progress-control'
import CopyProgress from "./dialogparts/CopyProgress"
import { DialogContext, ResultType } from "web-dialog-react"
import "functional-extensions"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { ErrorType, Nothing} from "functional-extensions"
import { WebViewType } from '../webview.ts'
import { webViewRequest } from "../requests/requests.ts"

declare const WebView: WebViewType

interface TitlebarProps {
    menu: JSX.Element
    progress: number
    progressFinished: boolean
    progressRevealed: boolean
    totalSize: number
}

const Titlebar = ({ menu, progress, progressFinished, progressRevealed, totalSize }: TitlebarProps) => {
    
    const dialog = useContext(DialogContext)

    const [move, _setMove] = useState(false)

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
                webViewRequest<Nothing, ErrorType>("cancelCopy")
        }

        start()
    }, [dialog, move, totalSize])

    useEffect(() => {
        WebView.initializeNoTitlebar()
	}, [])

    // useEffect(() => {
    //     const subscription = showProgressEvents.subscribe(() => startProgressDialog())
    //     return () => subscription.unsubscribe()
	// }, [startProgressDialog])

    useEffect(() => {
        if (dialogOpen.current)
            dialog.close()

    }, [progressRevealed, dialog])

    return  isWindows()        
        ? (<div className="titlebar">
            <img alt="" src="/webroot/images/kirk.png"/>
            {menu}
            <div className="titlebarGrip">
                <span id="$TITLE$"></span>
            </div>
            <div className={`pieContainer${progressRevealed ? " revealed" : ""}${progressFinished ? " finished" : ""}`} onClick={startProgressDialog}>
                <Pie progress={progress}/>
            </div>            
            <div className="titlebarButton" id="$MINIMIZE$"><span className="dash">&#x2012;</span></div>
            <div className="titlebarButton" id="$RESTORE$"><span>&#10697;</span></div>  
            <div className="titlebarButton" id="$MAXIMIZE$"><span>&#9744;</span></div>
            <div className={"titlebarButton close"} id="$CLOSE$"><span>&#10005;</span></div>
            
            </div>)
        : menu
}

export default Titlebar