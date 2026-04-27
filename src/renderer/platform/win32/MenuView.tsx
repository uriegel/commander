import Menu from "@/renderer/components/Menu"
import { MenuViewProps } from "../MenuView"
import Titlebar from "@/renderer/components/Titlebar"
import { useContext } from "react"
import { DialogContext } from "web-dialog-react"

const MenuView = ({ onMenuAction, showHidden, showViewer, viewerMode, fullscreen, toggleFullscreen,
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

export default MenuView