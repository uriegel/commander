import { useEffect, useRef, useState } from 'react'
import ViewSplit from 'view-split-react'
import { showDialog, Result } from 'web-dialog-react' 
import FolderView, { FolderViewHandle } from './components/FolderView'
import Menu from './components/Menu'
import './App.css'
import Statusbar from './components/Statusbar'
import { getExtension } from './controller/controller'
import PictureViewer from './components/PictureViewer'
import MediaPlayer from './components/MediaPlayer'

const ID_LEFT = "left"
const ID_RIGHT = "right"

interface PathProp {
	path: string
	isDirectory: boolean
}

const App = () => {

	const folderLeft = useRef<FolderViewHandle>(null)
	const folderRight = useRef<FolderViewHandle>(null)

	const [autoMode, setAutoMode] = useState(false)
	const [showHidden, setShowHidden] = useState(false)
	const [showViewer, setShowViewer] = useState(false)
	const [path, setPath] = useState<PathProp>({path: "", isDirectory: false})
	
	const setAndSaveAutoMode = (mode: boolean) => {
		setAutoMode(mode)
		localStorage.setItem("menuAutoHide", mode ? "true" : "false")
	}

	const setAutoModeDialog = async (autoMode: boolean) => 
		setAndSaveAutoMode(autoMode && ((await showDialog({
				text: "Soll das Menü verborgen werden? Aktivieren mit Alt-Taste",
				btnOk: true,
				btnCancel: true
			})).result == Result.Ok))
	
	const setShowHiddenAndRefresh = (show: boolean) => {
		setShowHidden(show)
		folderLeft.current?.refresh(show)
	}
	
	useEffect(() => {
		setAutoMode(localStorage.getItem("menuAutoHide") == "true")
		folderLeft.current?.setFocus()
	}, [])

	const onPathChanged = (path: string, isDirectory: boolean) => setPath({ path, isDirectory })

	const FolderLeft = () => (
		<FolderView ref={folderLeft} id={ID_LEFT} onFocus={onFocusLeft} onPathChanged={onPathChanged} showHidden={showHidden} />
	)
	const FolderRight = () => (
		<FolderView ref={folderRight} id={ID_RIGHT} onFocus={onFocusRight} onPathChanged={onPathChanged} showHidden={showHidden} />
	)

	const activeFolderId = useRef("left")
	const getActiveFolder = () => activeFolderId.current == ID_LEFT ? folderLeft.current : folderRight.current
	const getInactiveFolder = () => activeFolderId.current == ID_LEFT ? folderRight.current : folderLeft.current

	const onFocusLeft = () => activeFolderId.current = ID_LEFT
	const onFocusRight = () => activeFolderId.current = ID_RIGHT

	const onMenuAction = async (key: string) => {
		if (key == "REFRESH") {
			getActiveFolder()?.refresh()
		}
		else if (key == "SEL_ALL")
			getActiveFolder()?.selectAll()
		else if (key == "SEL_NONE")
			getActiveFolder()?.selectNone()
	}

	const VerticalSplitView = () => (
		<ViewSplit firstView={FolderLeft} secondView={FolderRight}></ViewSplit>
	)

	const ViewerView = () => {
		const ext = getExtension(path.path).toLocaleLowerCase()
		
		return ext == ".jpg" || ext == ".png"
			? (<PictureViewer path={path.path} />)
			: ext == ".mp3" || ext == ".mp4" || ext == ".mkv" || ext == ".wav"
			? (<MediaPlayer path={path.path} />)
			: (<div></div>)
	}

    const onKeyDown = (evt: React.KeyboardEvent) => {
		if (evt.code == "Tab" && !evt.shiftKey) {
			getInactiveFolder()?.setFocus()
			evt.preventDefault()
			evt.stopPropagation()
		}
	}
		
	return (
		<div className="App" onKeyDown={onKeyDown} >
			<Menu autoMode={autoMode} onMenuAction={onMenuAction} setAutoMode={setAutoModeDialog} showHidden={showHidden} setShowHidden={setShowHiddenAndRefresh}
				showViewer={showViewer} setShowViewer={setShowViewer}  />
			<ViewSplit isHorizontal={true} firstView={VerticalSplitView} secondView={ViewerView} initialWidth={30} secondVisible={showViewer} />
			<Statusbar path={path.path} dirCount={0} fileCount={0} />
		</div>
	)
}

export default App
