import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from "react"
import Menu from "./Menu"
import ViewSplit from "view-split-react"
import PictureViewer from "./viewers/PictureViewer"
import LocationViewer from "./viewers/LocationViewer"
import MediaPlayer from "./viewers/MediaPlayer"
import FileViewer from "./viewers/FileViewer"
import TrackViewer from "./viewers/TrackViewer"
import FolderView, { FolderViewHandle, ItemCount } from "./FolderView"
import { cmdRequest } from "../requests/requests"
import { Item } from "../items-provider/items"
import { DialogContext } from "web-dialog-react"
import Statusbar from "./StatusBar"

export const ID_LEFT = "left"
export const ID_RIGHT = "right"

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
	const folderLeft = useRef<FolderViewHandle>(null)
	const folderRight = useRef<FolderViewHandle>(null)
	const showHiddenRef = useRef(false)
	const activeFolderIdRef = useRef(ID_LEFT)
	
	const [showViewer, setShowViewer] = useState(false)    
    const [showHidden, setShowHidden] = useState(false)
	const [itemProperty, setItemProperty] = useState<ItemProperty>({ path: "", latitude: undefined, longitude: undefined, isDirectory: false })
	const [itemCount, setItemCount] = useState({ dirCount: 0, fileCount: 0 })
	const [statusTextLeft, setStatusTextLeft] = useState<string | undefined>(undefined)
	const [statusTextRight, setStatusTextRight] = useState<string | undefined>(undefined)
	const [errorText, setErrorText] = useState<string | null>(null)
	const [previewMode, _setPreviewMode] = useState(PreviewMode.Default)
	const [activeFolderId, setActiveFolderId] = useState(ID_LEFT)
		
	const getActiveFolder = useCallback(() => activeFolderIdRef.current == ID_LEFT ? folderLeft.current : folderRight.current, [])
	const getInactiveFolder = () => activeFolderIdRef.current == ID_LEFT ? folderRight.current : folderLeft.current

	const onKeyDown = (evt: React.KeyboardEvent) => {
		if (evt.code == "Tab" && !evt.shiftKey) {
			getInactiveFolder()?.setFocus()
			evt.preventDefault()
			evt.stopPropagation()
		}
	}

    useImperativeHandle(ref, () => ({
        onKeyDown
    }))

	const onFocusLeft = () => {
		activeFolderIdRef.current = ID_LEFT
		setActiveFolderId(activeFolderIdRef.current)
	}
	const onFocusRight = () => {
		activeFolderIdRef.current = ID_RIGHT
		setActiveFolderId(activeFolderIdRef.current)
	}

	const dialog = useContext(DialogContext)

	const showViewerRef = useRef(false)

    const onMenuAction = useCallback(async (key: string) => {
        switch (key) {
            case "REFRESH":
                getActiveFolder()?.refresh()
				break
			case "TOGGLE_SEL":
				getActiveFolder()?.insertSelection()
				break
			case "SEL_ALL":
				getActiveFolder()?.selectAll()
				break
			case "SEL_NONE":
				getActiveFolder()?.selectNone()
				break
			case "SHOW_DEV_TOOLS":
				await cmdRequest(key)
                break
		}
	}, [getActiveFolder])
    // TODO }, [getActiveFolder, getInactiveFolder, previewMode, showViewer])

	const toggleShowHiddenAndRefresh = () => {
		showHiddenRef.current = !showHiddenRef.current
		setShowHidden(showHiddenRef.current)
		folderLeft.current?.refresh(showHiddenRef.current)
		folderRight.current?.refresh(showHiddenRef.current)
	}
	
	const toggleShowViewer = () => {
		showViewerRef.current = !showViewerRef.current
		setShowViewer(showViewerRef.current)
	}
	
	const onItemChanged = useCallback(
		(id: string, path: string, isDirectory: boolean, latitude?: number, longitude?: number) => {
			if (id == activeFolderIdRef.current)
				setItemProperty({ path, isDirectory, latitude, longitude })
		}
	, [])
	
	const onEnter = (item: Item) => {
		getActiveFolder()?.processEnter(item, getInactiveFolder()?.getPath())
	}

	const setActiveItemCount = (id: string, count: ItemCount) => {
		if (id == activeFolderIdRef.current)
			setItemCount(count)
	}
	
	const FolderLeft = () => (
		<FolderView ref={folderLeft} id={ID_LEFT} onFocus={onFocusLeft} onItemChanged={onItemChanged} onEnter= {onEnter}
			onItemsChanged={setActiveItemCount} showHidden={showHidden} setStatusText={setStatusTextLeft} dialog={dialog} setErrorText={err => setErrorText(err||null)} />
	)
	const FolderRight = () => (
		<FolderView ref={folderRight} id={ID_RIGHT} onFocus={onFocusRight} onItemChanged={onItemChanged} onEnter= {onEnter}
			onItemsChanged={setActiveItemCount} showHidden={showHidden} setStatusText={setStatusTextRight} dialog={dialog} setErrorText={err => setErrorText(err||null)} />
	)

	const getStatusText = useCallback(() => 
		activeFolderId == ID_LEFT ? statusTextLeft : statusTextRight
	, [activeFolderId, statusTextLeft, statusTextRight])

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
			<Statusbar path={itemProperty.path} dirCount={itemCount.dirCount} fileCount={itemCount.fileCount}
					errorText={errorText} setErrorText={setErrorText} statusText={getStatusText()} />		
        </>
    )
})

export default Commander