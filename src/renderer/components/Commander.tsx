import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react"
import Menu from "./Menu"
import ViewSplit from "view-split-react"
import PictureViewer from "./viewers/PictureViewer"
import LocationViewer from "./viewers/LocationViewer"
import MediaPlayer from "./viewers/MediaPlayer"
import FileViewer from "./viewers/FileViewer"
import TrackViewer from "./viewers/TrackViewer"
import FolderView, { FolderViewHandle, FolderViewItem } from "./FolderView"
import { cmdRequest } from "../requests/requests"

const ID_LEFT = "left"
const ID_RIGHT = "right"

const PreviewMode = {
    Default: 'Default',
    Location: 'Location',
    Both: 'Both'
}
type PreviewMode = (typeof PreviewMode)[keyof typeof PreviewMode]

interface ItemProperty {
	path: string
	latitude?: number 
	longitude?: number
	isDirectory: boolean
}

export type CommanderHandle = {
    onKeyDown: (evt: React.KeyboardEvent)=>void
}

const Commander = forwardRef<CommanderHandle, object>((_, ref) => {
    useImperativeHandle(ref, () => ({
        onKeyDown
    }))

	const folderLeft = useRef<FolderViewHandle>(null)
	const folderRight = useRef<FolderViewHandle>(null)

	const [showViewer, setShowViewer] = useState(false)    
    const [showHidden, setShowHidden] = useState(false)
    const [itemProperty, setItemProperty] = useState<ItemProperty>({ path: "", latitude: undefined, longitude: undefined, isDirectory: false })
	const [statusTextLeft, setStatusTextLeft] = useState<string | undefined>(undefined)
	const [statusTextRight, setStatusTextRight] = useState<string | undefined>(undefined)
	const [previewMode, setPreviewMode] = useState(PreviewMode.Default)
	
	const [activeFolderId, setActiveFolderId] = useState(ID_LEFT)
	const onFocusLeft = () => setActiveFolderId(ID_LEFT)
	const onFocusRight = () => setActiveFolderId(ID_RIGHT)

	const showViewerRef = useRef(false)

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
			case "SHOW_DEV_TOOLS":
				await cmdRequest(key)
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
		showViewerRef.current = !showViewerRef.current
		setShowViewer(showViewerRef.current)
	}
	
	const onItemChanged = useCallback(
		(path: string, isDirectory: boolean, latitude?: number, longitude?: number) => 
			setItemProperty({ path, isDirectory, latitude, longitude })
	, [])
	
	const onEnter = (item: FolderViewItem) => {
		// getActiveFolder()?.processEnter(item, getInactiveFolder()?.getPath())
	}
	

	const FolderLeft = () => (
		<FolderView ref={folderLeft} id={ID_LEFT} onFocus={onFocusLeft} onItemChanged={onItemChanged} onEnter= {onEnter}
			showHidden={showHidden} setStatusText={setStatusTextLeft} />
	)
	const FolderRight = () => (
		<FolderView ref={folderRight} id={ID_RIGHT} onFocus={onFocusRight} onItemChanged={onItemChanged} onEnter= {onEnter}
			showHidden={showHidden} setStatusText={setStatusTextRight} />
	)

	const VerticalSplitView = () => (
        <ViewSplit firstView={FolderLeft} secondView={FolderRight}></ViewSplit>
    )

    const ViewerView = () => {
		const ext = itemProperty
					.path
					.getExtension()
					.toLocaleLowerCase()
		
		return ext == ".jpg" || ext == ".png" || ext == ".jpeg"
		 	? previewMode == PreviewMode.Default
			? (<PictureViewer path={itemProperty.path} latitude={itemProperty.latitude} longitude={itemProperty.longitude} />)
			: previewMode == PreviewMode.Location && itemProperty.latitude && itemProperty.longitude
			? (<LocationViewer latitude={itemProperty.latitude} longitude={itemProperty.longitude} />)
			: itemProperty.latitude && itemProperty.longitude
			? <div className='bothViewer'>
					<PictureViewer path={itemProperty.path} latitude={itemProperty.latitude} longitude={itemProperty.longitude} />
					<LocationViewer latitude={itemProperty.latitude} longitude={itemProperty.longitude} />
				</div>
			:(<PictureViewer path={itemProperty.path} latitude={itemProperty.latitude} longitude={itemProperty.longitude} />)
		 	: ext == ".mp3" || ext == ".mp4" || ext == ".mkv" || ext == ".wav"
		 	? (<MediaPlayer path={itemProperty.path} />)
		 	: ext == ".pdf"
		 	? (<FileViewer path={itemProperty.path} />)
		 	: ext == ".gpx"
		 	? (<TrackViewer path={itemProperty.path} />)
         	: (<div></div>)
	}
    
    return (
        <>
            <Menu autoMode={true} onMenuAction={onMenuAction}
				showHidden={showHidden} toggleShowHidden={toggleShowHiddenAndRefresh}
                showViewer={showViewer} toggleShowViewer={toggleShowViewer}
            />            
            <ViewSplit isHorizontal={true} firstView={VerticalSplitView} secondView={ViewerView} initialWidth={30} secondVisible={showViewer} />
        </>
    )
})

export default Commander