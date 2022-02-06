export declare global {
	interface Window {
        close(): ()=>void
        
        onClose: ()=>void
        onViewer: (isChecked: boolean)=>void
        onFullscreen: ()=>void
        onDevTools: ()=>void
    }
}