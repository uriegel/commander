import { JSX } from "react"
import { ViewerMode } from "../components/Menu"

export interface MenuViewProps {
    onMenuAction: (cmd: string) => Promise<void>
    showHidden: boolean
    showViewer: boolean
    viewerMode: ViewerMode
    setViewerMode: (mode: ViewerMode) => void
    toggleShowHiddenAndRefresh: () => void
    toggleShowViewer: () => void
}
export const MenuView: ({ onMenuAction, showHidden, showViewer, viewerMode,
        toggleShowHiddenAndRefresh, toggleShowViewer, setViewerMode }: MenuViewProps) => JSX.Element
