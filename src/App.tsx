import { useEffect, useRef, useState } from 'react'
import ViewSplit from 'view-split-react'
import { showDialog, Result } from 'web-dialog-react' 
import FolderView, { FolderViewHandle } from './components/FolderView'
import Menu from './components/Menu'
import Statusbar from './components/Statusbar'
import { getExtension } from './controller/controller'
import PictureViewer from './components/PictureViewer'
import MediaPlayer from './components/MediaPlayer'
import { request } from './controller/requests'
import './App.css'
import './themes/adwaita.css'
import './themes/adwaitaDark.css'
import './themes/windows.css'
import './themes/windowsDark.css'
import { getTheme } from './globals'
import { themeChangedEvents } from './controller/events'
import { getCopyController } from './controller/copyController'

const ID_LEFT = "left"
const ID_RIGHT = "right"

interface PathProp {
	path: string
	isDirectory: boolean
}

const App = () => {

	const folderLeft = useRef<FolderViewHandle>(null)
	const folderRight = useRef<FolderViewHandle>(null)

	const [theme, setTheme] = useState(getTheme())
	const [autoMode, setAutoMode] = useState(false)
	const [showHidden, setShowHidden] = useState(false)
	const [showViewer, setShowViewer] = useState(false)
	const [path, setPath] = useState<PathProp>({ path: "", isDirectory: false })
	const [itemCount, setItemCount] = useState({dirCount: 0, fileCount: 0 })
		
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
		themeChangedEvents.subscribe(setTheme)
		folderLeft.current?.setFocus()
	}, [])

	const onPathChanged = (path: string, isDirectory: boolean) => setPath({ path, isDirectory })

	const FolderLeft = () => (
		<FolderView ref={folderLeft} id={ID_LEFT} onFocus={onFocusLeft} onPathChanged={onPathChanged} showHidden={showHidden} onItemsChanged={setItemCount} />
	)
	const FolderRight = () => (
		<FolderView ref={folderRight} id={ID_RIGHT} onFocus={onFocusRight} onPathChanged={onPathChanged} showHidden={showHidden} onItemsChanged={setItemCount} />
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
		else if (key == "END")
			window.close()
		else if (key == "SEL_ALL")
			getActiveFolder()?.selectAll()
		else if (key == "SEL_NONE")
			getActiveFolder()?.selectNone()
		else if (key == "SHOW_DEV_TOOLS")
			await request("showdevtools")
		else if (key == "SHOW_FULLSCREEN")
			await request("showfullscreen")
		else if (key == "ADAPT_PATH") {
			const path = getActiveFolder()?.getPath()
			if (path)
				getInactiveFolder()?.changePath(path)
		} else if (key == "RENAME")
			await getActiveFolder()?.rename()
		else if (key == "CREATE_FOLDER")
			await getActiveFolder()?.createFolder()
		else if (key == "DELETE")
			await getActiveFolder()?.deleteItems()
		else if (key == "COPY")			
			await copyItems(false)
		else if (key == "MOVE")			
			await copyItems(true)
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
	
	const copyItems = async (move: boolean) => {
		const active = getActiveFolder()
		const inActive = getInactiveFolder()
		const controller = getCopyController(move, active?.getController(), inActive?.getController(),
			active?.getPath(), inActive?.getPath(), active?.getSelectedItems(), inActive?.getItems())
		const result = await controller?.copy()
	}

	return (
		<div className={`App ${theme}Theme`} onKeyDown={onKeyDown} >
			<Menu autoMode={autoMode} onMenuAction={onMenuAction} setAutoMode={setAutoModeDialog} showHidden={showHidden} setShowHidden={setShowHiddenAndRefresh}
				showViewer={showViewer} setShowViewer={setShowViewer}  />
			<ViewSplit isHorizontal={true} firstView={VerticalSplitView} secondView={ViewerView} initialWidth={30} secondVisible={showViewer} />
			<Statusbar path={path.path} dirCount={itemCount.dirCount} fileCount={itemCount.fileCount} />
		</div>
	)
}

export default App

