export declare global {
	interface Window {
        close(): ()=>void

        onDelete: ()=>void        
        onRename: ()=>void        
        onClose: ()=>void
        onSelectAll: ()=>void
        onSelectNone: ()=>void
        onViewer: (isChecked: boolean)=>void
        onAdaptPath: ()=>void
        onRefresh: ()=>void
        onHidden: (isChecked: boolean)=>void
        onHideMenu: (isChecked: boolean)=>void
        onFullscreen: ()=>void
        onDevTools: ()=>void
    }
}