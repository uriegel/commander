import { useEffect, useRef, useState } from 'react'
import ViewSplit from 'view-split-react'
import Dialog, { DialogHandle, Result } from 'web-dialog-react' 
import FolderView, { FolderViewHandle, FolderViewItem } from './components/FolderView'
import Menu from './components/Menu'
import Statusbar from './components/Statusbar'
import { checkResult } from './controller/controller'
import PictureViewer from './components/PictureViewer'
import MediaPlayer from './components/MediaPlayer'
import { request } from './requests/requests'
import './App.css'
import './themes/adwaita.css'
import './themes/adwaitaDark.css'
import './themes/windows.css'
import './themes/windowsDark.css'
import { getTheme } from './globals'
import { themeChangedEvents } from './requests/events'
import { getCopyController } from './controller/copy/copyController'
import FileViewer from './components/FileViewer'
import "functional-extensions"
import "./extensions/extensions"
import { SpecialKeys } from 'virtual-table-react'

// TODO in webview.d.ts
declare const webViewShowDevTools: ()=>void

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
	const showHiddenRef = useRef(false)
	const showViewerRef = useRef(false)
	const [path, setPath] = useState<PathProp>({ path: "", isDirectory: false })
	const [itemCount, setItemCount] = useState({dirCount: 0, fileCount: 0 })
	
	const dialog = useRef<DialogHandle>(null)
		
	const setAndSaveAutoMode = (mode: boolean) => {
		setAutoMode(mode)
		localStorage.setItem("menuAutoHide", mode ? "true" : "false")
	}

	const toggleAutoModeDialog = async () => 
		setAndSaveAutoMode(autoMode == false && ((await dialog.current?.show({
				text: "Soll das Menü verborgen werden? Aktivieren mit Alt-Taste",
				btnOk: true,
				btnCancel: true
			}))?.result == Result.Ok))
	
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

	useEffect(() => {
		setAutoMode(localStorage.getItem("menuAutoHide") == "true")
		themeChangedEvents.subscribe(setTheme)
		folderLeft.current?.setFocus()
	}, [])

	const onPathChanged = (path: string, isDirectory: boolean) => setPath({ path, isDirectory })

	const onEnter = async (item: FolderViewItem, keys: SpecialKeys) => 
		await getActiveFolder()?.processEnter(item, keys, getInactiveFolder()?.getPath())

	const FolderLeft = () => (
		<FolderView ref={folderLeft} id={ID_LEFT} dialog={dialog.current} onFocus={onFocusLeft} onCopy={copyItems}
			onPathChanged={onPathChanged} showHidden={showHidden} onItemsChanged={setItemCount} onEnter={onEnter} />
	)
	const FolderRight = () => (
		<FolderView ref={folderRight} id={ID_RIGHT} dialog={dialog.current} onFocus={onFocusRight} onCopy={copyItems}
			onPathChanged={onPathChanged} showHidden={showHidden} onItemsChanged={setItemCount} onEnter={onEnter} />
	)

	const activeFolderId = useRef("left")
	const getActiveFolder = () => activeFolderId.current == ID_LEFT ? folderLeft.current : folderRight.current
	const getInactiveFolder = () => activeFolderId.current == ID_LEFT ? folderRight.current : folderLeft.current

	const onFocusLeft = () => activeFolderId.current = ID_LEFT
	const onFocusRight = () => activeFolderId.current = ID_RIGHT

	const onMenuAction = async (key: string) => {
		if (key == "REFRESH") 
			getActiveFolder()?.refresh()
		else if (key == "END") 
			window.close()
		else if (key == "SEL_ALL")
			getActiveFolder()?.selectAll()
		else if (key == "SEL_NONE")
			getActiveFolder()?.selectNone()
		else if (key == "SHOW_DEV_TOOLS")
			webViewShowDevTools()
		else if (key == "SHOW_FULLSCREEN")
			await request("showfullscreen")
		else if (key == "FAVORITES")
			getActiveFolder()?.changePath("fav")
		else if (key == "ADAPT_PATH") {
			const path = getActiveFolder()?.getPath()
			if (path)
				getInactiveFolder()?.changePath(path)
		} else if (key == "RENAME")
			await getActiveFolder()?.rename()
		else if (key == "EXTENDED_RENAME")
			getActiveFolder()?.extendedRename(dialog.current)
		else if (key == "CREATE_FOLDER")
			await getActiveFolder()?.createFolder()
		else if (key == "DELETE")
			await getActiveFolder()?.deleteItems()
		else if (key == "COPY")			
			await copyItems(false)
		else if (key == "MOVE")			
			await copyItems(true)
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
		const controller = getCopyController(move, dialog.current, active?.id == ID_LEFT, active?.getController()!, inActive?.getController()!,
			active?.getPath()!, inActive?.getPath()!, active?.getSelectedItems()!, inActive?.getItems()!)
		const result = controller ? await controller.copy() : null
		if (await checkResult(dialog.current, active, result)) {
			if (move)
				active?.refresh()
			inActive?.refresh()
		} 
	}

	const VerticalSplitView = () => (
		<ViewSplit firstView={FolderLeft} secondView={FolderRight}></ViewSplit>
	)

	const ViewerView = () => {
		const ext = path
					.path
					.getExtension()
					.toLocaleLowerCase()
		
		return ext == ".jpg" || ext == ".png"
			? (<PictureViewer path={path.path} />)
			: ext == ".mp3" || ext == ".mp4" || ext == ".mkv" || ext == ".wav"
			? (<MediaPlayer path={path.path} />)
			: ext == ".pdf"
			? (<FileViewer path={path.path} />)
			: (<div></div>)
	}

	return (
		<div className={`App ${theme}Theme`} onKeyDown={onKeyDown} >
			<Menu autoMode={autoMode} onMenuAction={onMenuAction} toggleAutoMode={toggleAutoModeDialog}
				showHidden={showHidden} toggleShowHidden={toggleShowHiddenAndRefresh}
				showViewer={showViewer} toggleShowViewer={toggleShowViewer} />
			<ViewSplit isHorizontal={true} firstView={VerticalSplitView} secondView={ViewerView} initialWidth={30} secondVisible={showViewer} />
			<Statusbar path={path.path} dirCount={itemCount.dirCount} fileCount={itemCount.fileCount} />
			<Dialog ref={dialog} />
		</div>
	)
}

export default App


