import { JSX } from "react"
import { ViewerMode } from "../components/Menu"

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
export const MenuView: ({ onMenuAction, showHidden, showViewer, viewerMode,
        toggleShowHiddenAndRefresh, toggleShowViewer, setViewerMode, fullscreen, toggleFullscreen }: MenuViewProps) => JSX.Element
