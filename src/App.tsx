import { useEffect, useRef, useState } from 'react'
import ViewSplit from 'view-split-react'
import { showDialog, Result } from 'web-dialog-react' 
import FolderView, { FolderViewHandle } from './components/FolderView'
import Menu from './components/Menu'
import './App.css'
import Statusbar from './components/Statusbar'

const App = () => {

	const folderLeft = useRef<FolderViewHandle>(null)
	const folderRight = useRef<FolderViewHandle>(null)

	const [autoMode, setAutoMode] = useState(false)
	const [showHidden, setShowHidden] = useState(false)
	const [showViewer, setShowViewer] = useState(false)
	
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

	const FolderLeft = () => (
		<FolderView ref={folderLeft} id="left" onFocus={onFocusLeft} showHidden={showHidden} />
	)
	const FolderRight = () => (
		<FolderView ref={folderRight} id="right" onFocus={onFocusRight} showHidden={showHidden} />
	)

	const activeFolder = useRef(folderLeft.current)
	const getInactiveFolder = () => activeFolder.current?.id == folderLeft.current?.id ? folderRight.current : folderLeft.current

	const onFocusLeft = () => activeFolder.current = folderLeft.current
	const onFocusRight = () => activeFolder.current = folderRight.current

	const onMenuAction = async (key: string) => {
		if (key == "REFRESH") {

			
	//		folderLeft.current?.refresh()
			activeFolder.current?.refresh()
		}
		else if (key == "SEL_ALL")
			activeFolder.current?.selectAll()
		else if (key == "SEL_NONE")
			activeFolder.current?.selectNone()
	}

	const VerticalSplitView = () => (
		<ViewSplit firstView={FolderLeft} secondView={FolderRight}></ViewSplit>
	)

	const ViewerView = () => (
		<div></div>
	)

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
			<Statusbar path={""} dirCount={0} fileCount={0} />
		</div>
	)
}

export default App
