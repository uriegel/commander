import Menu from "@/renderer/components/Menu"
import { MenuViewProps } from "../MenuView"

const MenuView = ({ onMenuAction, showHidden, showViewer, viewerMode,
        toggleShowHiddenAndRefresh, toggleShowViewer, setViewerMode }: MenuViewProps) => (
    <Menu autoMode={true} onMenuAction={onMenuAction}
        showHidden={showHidden} toggleShowHidden={toggleShowHiddenAndRefresh}
        showViewer={showViewer} toggleShowViewer={toggleShowViewer}
        viewerMode={viewerMode} setViewerMode={setViewerMode}
    />            
)

export default MenuView