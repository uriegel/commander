import { useContext } from "react"
import { DialogContext } from "web-dialog-react"
import { type DialogHandle } from "web-dialog-react"
import Titlebar from "../../components/Titlebar"
import type { ViewerMode } from "../../components/Menu"
import Menu from "../../components/Menu"

export interface MenuViewProps {
    onMenuAction: (cmd: string, dialog: DialogHandle) => Promise<void>
    showHidden: boolean
    showViewer: boolean
    viewerMode: ViewerMode
    setViewerMode: (mode: ViewerMode) => void
    toggleShowHiddenAndRefresh: () => void
    toggleShowViewer: () => void
    fullscreen: boolean
    toggleFullscreen: () => void,
}

export const WindowsMenuView = ({ onMenuAction, showHidden, showViewer, viewerMode, fullscreen, toggleFullscreen,
    toggleShowHiddenAndRefresh, toggleShowViewer, setViewerMode }: MenuViewProps) => {
    const dialog = useContext(DialogContext)
    return (
        <Titlebar menu={(
            <Menu autoMode={false} onMenuAction={cmd => onMenuAction(cmd, dialog)}
                showHidden={showHidden} toggleShowHidden={toggleShowHiddenAndRefresh}
                showViewer={showViewer} toggleShowViewer={toggleShowViewer}
                viewerMode={viewerMode} setViewerMode={setViewerMode}
                fullscreen={fullscreen} toggleFullscreen={toggleFullscreen}
            />            
        )} />		
    )
}

export default WindowsMenuView