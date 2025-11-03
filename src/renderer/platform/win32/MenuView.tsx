import Menu from "@/renderer/components/Menu"
import { MenuViewProps } from "../MenuView"
import Titlebar from "@/renderer/components/Titlebar"

const MenuView = ({ onMenuAction, showHidden, showViewer, viewerMode,
        toggleShowHiddenAndRefresh, toggleShowViewer, setViewerMode }: MenuViewProps) => {
    return (
        <Titlebar menu={(
            <Menu autoMode={false} onMenuAction={onMenuAction}
                showHidden={showHidden} toggleShowHidden={toggleShowHiddenAndRefresh}
                showViewer={showViewer} toggleShowViewer={toggleShowViewer}
                viewerMode={viewerMode} setViewerMode={setViewerMode}
            />            
        )} />		
    )
}

export default MenuView