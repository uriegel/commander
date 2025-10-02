import { forwardRef, useCallback, useImperativeHandle, useState } from "react"
import Menu from "./Menu"

export type CommanderHandle = {
    onKeyDown: (evt: React.KeyboardEvent)=>void
}

const Commander = forwardRef<CommanderHandle, object>((_, ref) => {
    useImperativeHandle(ref, () => ({
        onKeyDown
    }))

    const [showViewer, setShowViewer] = useState(false)    
    const [showHidden, setShowHidden] = useState(false)

    const onKeyDown = (evt: React.KeyboardEvent) => {
        if (evt.code == "Tab" && !evt.shiftKey) {
            // TODO		getInactiveFolder()?.setFocus()
            evt.preventDefault()
            evt.stopPropagation()
        }
    }

    const onMenuAction = useCallback(async (key: string) => {
        switch (key) {
            case "REFRESH":
                // TODO getActiveFolder()?.refresh()
                break
        }
        // TODO }, [getActiveFolder, getInactiveFolder, previewMode, showViewer])
    }, [])

	const toggleShowHiddenAndRefresh = () => {
		// showHiddenRef.current = !showHiddenRef.current
		// setShowHidden(showHiddenRef.current)
		// folderLeft.current?.refresh(showHiddenRef.current)
		// folderRight.current?.refresh(showHiddenRef.current)
	}
	
	const toggleShowViewer = () => {
		// showViewerRef.current = !showViewerRef.current
		// setShowViewer(showViewerRef.current)
	}
    
    return (
        <>
            <Menu autoMode={true} onMenuAction={onMenuAction}
				showHidden={showHidden} toggleShowHidden={toggleShowHiddenAndRefresh}
                showViewer={showViewer} toggleShowViewer={toggleShowViewer}
            />            
            <div>Kommandant</div>
        </>
    )
})

export default Commander