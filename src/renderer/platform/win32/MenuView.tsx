import Menu from "@/renderer/components/Menu"
import { MenuViewProps } from "../MenuView"
import Titlebar, { TitlebarHandle } from "@/renderer/components/Titlebar"
import { useRef } from "react"

const MenuView = ({ onMenuAction, showHidden, showViewer, viewerMode,
        toggleShowHiddenAndRefresh, toggleShowViewer, setViewerMode }: MenuViewProps) => {
    const titlebar = useRef(null as TitlebarHandle|null)
    return (
        <Titlebar ref={titlebar} menu={(
            <Menu autoMode={true} onMenuAction={onMenuAction}
                showHidden={showHidden} toggleShowHidden={toggleShowHiddenAndRefresh}
                showViewer={showViewer} toggleShowViewer={toggleShowViewer}
                viewerMode={viewerMode} setViewerMode={setViewerMode}
            />            
        )} />		
    )
}

export default MenuView