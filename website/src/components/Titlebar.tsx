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
import { disposedProgress, fileProgress, finishedProgress, ProgressFile, ProgressStart, startProgress } from "../requests/events.ts"
import { BehaviorSubject } from "rxjs"

declare const WebView: WebViewType

interface TitlebarProps {
    menu: JSX.Element
}

export const progressStartEvents = new BehaviorSubject<ProgressStart>({ kind: "start", totalFiles: 0, totalSize: 0 })
export const progressFileEvents = new BehaviorSubject<ProgressFile>({kind:"file", currentBytes: 0, currentFile: 0, fileName: ""})

const Titlebar = ({ menu, }: TitlebarProps) => {
    
    const dialog = useContext(DialogContext)

    const [move, _setMove] = useState(false)

    const dialogOpen = useRef(false)

    const [progressRevealed, setProgressRevealed] = useState(false)
	const [progressFinished, setProgressFinished] = useState(false)
    const [currentCount, setCurrentCount] = useState(0)
    const [totalValue, setTotalValue] = useState(0)
    const [fileName, setFileName] = useState("")
    const [totalCount, setTotalCount] = useState(0)
	const [totalSize, setTotalSize] = useState(0)
	const [progress] = useState(0)

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
    
	useEffect(() => {
        const startSubscription = startProgress.subscribe(e => {
            progressStartEvents.next(e)
			setProgressRevealed(true)
			setProgressFinished(false)
            setTotalCount(e.totalFiles)
			setTotalSize(e.totalSize)
		})
        const fileSubscription = fileProgress.subscribe(e => {
            progressFileEvents.next(e)
            //         setCurrentTime(e.copyTime)
            //         setMax(e.totalFileBytes)
            //         setValue(e.currentFileBytes)
            //         setTotalValue(e.currentBytes)
                })
                const finishedProgressSubscription = finishedProgress.subscribe(() => {
			setProgressFinished(true)
		})
        const disposedProgressSubscription = disposedProgress.subscribe(() => {
			setProgressRevealed(false)
		})
		return () => {
            startSubscription.unsubscribe()
            fileSubscription.unsubscribe()
			finishedProgressSubscription?.unsubscribe()
			disposedProgressSubscription?.unsubscribe()
		}
	// 			setProgress(e.currentBytes/e.totalBytes)
	// 		setTotalMax(e.totalBytes)
    //     const subscription = progressChangedEvents.subscribe(e => setMove(e.isMove))
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