import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react'
import ViewSplit from 'view-split-react'
import { DialogContext } from 'web-dialog-react' 
import FolderView, { FolderViewHandle, FolderViewItem } from './components/FolderView'
import Menu from './components/Menu'
import Statusbar from './components/Statusbar'
import { Controller, showError } from './controller/controller'
import PictureViewer from './components/PictureViewer'
import MediaPlayer from './components/MediaPlayer'
import './App.css'
import './themes/adwaita.css'
import './themes/windows.css'
import { isWindows } from './globals'
//import { copyErrorEvents, filesDropEvents, getCredentialsEvents,  progressChangedEvents } from './requests/events'
import { Progress, showHiddenEvents, showPreviewEvents } from './requests/events'
import { getCopyController } from './controller/copy/copyController'
import FileViewer from './components/FileViewer'
import { SpecialKeys } from 'virtual-table-react'
import Titlebar from './components/Titlebar'
//import { createFileSystemController } from './controller/filesystem'
import './extensions/extensions'
//import Credentials, { CredentialsProps } from './components/dialogparts/Credentials'
import LocationViewer from './components/LocationViewer'
import TrackViewer from './components/TrackViewer'
import { WebViewType, WebViewEvents } from './webview.ts'

declare const WebView: WebViewType
declare const webViewEvents: WebViewEvents

enum PreviewMode {
	Default,
	Location,
	Both
}

const ID_LEFT = "left"
const ID_RIGHT = "right"

interface PathProp {
	path: string
	latitude?: number 
	longitude?: number
	isDirectory: boolean
}

// type CredentialsResult = {
//     name: string
//     password: string
// }

export type CommanderHandle = {
    onKeyDown: (evt: React.KeyboardEvent)=>void
}

type CommanderProps = object

const Commander = forwardRef<CommanderHandle, CommanderProps>((_, ref) => {

    useImperativeHandle(ref, () => ({
        onKeyDown
    }))

	const folderLeft = useRef<FolderViewHandle>(null)
	const folderRight = useRef<FolderViewHandle>(null)

	const [showHidden, setShowHidden] = useState(false)
	const [showViewer, setShowViewer] = useState(false)
	const showHiddenRef = useRef(false)
	const showViewerRef = useRef(false)
	const [path, setPath] = useState<PathProp>({ path: "", latitude: undefined, longitude: undefined, isDirectory: false })
	const [errorText, setErrorText] = useState<string | null>(null)
	const [statusText, setStatusText] = useState<string | null>(null)
	const [itemCount, setItemCount] = useState({dirCount: 0, fileCount: 0 })
	const [progress] = useState(0)
	const [progressRevealed, setProgressRevealed] = useState(false)
	const [progressFinished, setProgressFinished] = useState(false)
	const [totalMax] = useState(0)
	const dialog = useContext(DialogContext)
	
	webViewEvents.registerShowHidden(setShowHidden)
	webViewEvents.registerShowPreview(setShowViewer)
	
	// const filesDropSubscription = useRef<Subscription | null>(null)
	// const getCredentialsSubscription = useRef<Subscription | null>(null)
	// const copyErrorSubscription = useRef<Subscription | null>(null)
		
	const copyItemsToInactive = useCallback((inactive: FolderViewHandle | null, move: boolean, activeController: Controller,
			activePath: string, itemsToCopy: FolderViewItem[], id?: string) => {
		const controller = inactive && getCopyController(move, dialog, id == ID_LEFT, activeController, inactive.getController(),
			activePath, inactive.getPath(), itemsToCopy, inactive.getItems())
		if (controller) {
			const inactivePath = inactive.getPath()
			const activeFolder = getActiveFolder()
			controller
				.copy()
				.match(
					() => {
						if (inactivePath == inactive.getPath()) 
							inactive.refresh()
						if (move && activePath == activeFolder?.getPath())
							getActiveFolder()?.refresh()
					},
					e => showError(e, setErrorText))
		}
	}, [dialog])

	useEffect(() => {
		// const copyItemsFromFileSystem = async (id: string, path: string,  items: FolderViewItem[], move: boolean) => {
		// 	const inactive = id == ID_LEFT ? folderLeft.current : folderRight.current
		// 	copyItemsToInactive(inactive, move, createFileSystemController(), path, items, id)
		// }

		// filesDropSubscription.current?.unsubscribe()
		// filesDropSubscription.current = filesDropEvents.subscribe(filesDrop => 
		// 	copyItemsFromFileSystem(filesDrop.id, filesDrop.path, filesDrop.items, filesDrop.move))
		
		// getCredentialsSubscription.current?.unsubscribe()
		// getCredentialsSubscription.current = getCredentialsEvents.subscribe(getCredentials => {
		// 	let name = ""
		// 	let password = ""
        //     dialog.showDialog<CredentialsResult, ErrorType>({
        //         text: "Bitte Zugangsdaten eingeben:",
        //         extension: Credentials,
        //         extensionProps: { name, password },
        //         onExtensionChanged: (e: CredentialsProps) => {
        //             name = e.name
        //             password = e.password
        //         },
        //         btnOk: true,
        //         btnCancel: true,
        //         defBtnOk: true
        //     }, res => res.result == ResultType.Ok
        //         ? new Ok({ name, password, path: getCredentials.path })
        //         : new Err({ status: IOError.Canceled, statusText: "" }))
        //         .toResult()
        //         .then(res => jsonPost<CredentialsResult, ErrorType>({ method: "sendcredentials", payload: res }))
        // })
	}, [dialog, copyItemsToInactive])

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
		folderLeft.current?.setFocus()
	}, [])

	const onPathChanged = useCallback(
		(path: string, isDirectory: boolean, latitude?: number, longitude?: number) => setPath({ path, isDirectory, latitude, longitude }
	), [])

	const onEnter = (item: FolderViewItem, keys: SpecialKeys) => {
		getActiveFolder()?.processEnter(item, keys, getInactiveFolder()?.getPath())
	}

	const FolderLeft = () => (
		<FolderView ref={folderLeft} id={ID_LEFT} onFocus={onFocusLeft} onCopy={copyItems} setError={setErrorText}
			onPathChanged={onPathChanged} showHidden={showHidden} onItemsChanged={setItemCount} onEnter={onEnter}
			setStatusText={setStatusText} />
	)
	const FolderRight = () => (
		<FolderView ref={folderRight} id={ID_RIGHT} onFocus={onFocusRight} onCopy={copyItems} setError={setErrorText}
			onPathChanged={onPathChanged} showHidden={showHidden} onItemsChanged={setItemCount} onEnter={onEnter}
			setStatusText={setStatusText} />
	)

	const activeFolderId = useRef("left")
	const getActiveFolder = () => activeFolderId.current == ID_LEFT ? folderLeft.current : folderRight.current
	const getInactiveFolder = () => activeFolderId.current == ID_LEFT ? folderRight.current : folderLeft.current

	const onFocusLeft = () => activeFolderId.current = ID_LEFT
	const onFocusRight = () => activeFolderId.current = ID_RIGHT
	const [previewMode, setPreviewMode] = useState(PreviewMode.Default)

	const copyItems = useCallback(async (move: boolean) => {
		const active = getActiveFolder()
		const inactive = getInactiveFolder()
		if (active && inactive)
			copyItemsToInactive(inactive, move, active.getController(), active.getPath(), active.getSelectedItems(), active.id)
	}, [copyItemsToInactive])

	const onMenuAction = useCallback(async (key: string) => {
		if (key == "REFRESH") 
			getActiveFolder()?.refresh()
		else if (key == "END") 
			WebView.closeWindow()
		else if (key == "SEL_ALL")
			getActiveFolder()?.selectAll()
		else if (key == "SEL_NONE")
			getActiveFolder()?.selectNone()
		else if (key == "SHOW_DEV_TOOLS")
			WebView.showDevTools()
		// TODO
		// else if (key == "SHOW_FULLSCREEN")
		// 	await request("showfullscreen")
		else if (key == "FAVORITES")
			getActiveFolder()?.changePath("fav")
		else if (key == "ADAPT_PATH") {
			const path = getActiveFolder()?.getPath()
			if (path)
				getInactiveFolder()?.changePath(path)
		} else if (key == "RENAME")
			getActiveFolder()?.rename()
		else if (key == "EXTENDED_RENAME")
			getActiveFolder()?.extendedRename(dialog)
		else if (key == "TOGGLE_PREVIEW") {
			setPreviewMode(previewMode == PreviewMode.Default
				? PreviewMode.Location
				: previewMode == PreviewMode.Location
					? PreviewMode.Both
					: PreviewMode.Default)
		}
		else if (key == "RENAME_AS_COPY")
			getActiveFolder()?.renameAsCopy()
		else if (key == "CREATE_FOLDER")
			getActiveFolder()?.createFolder()
		else if (key == "DELETE")
			getActiveFolder()?.deleteItems()
		else if (key == "COPY")			
			await copyItems(false)
		else if (key == "MOVE")			
			await copyItems(true)
	}, [copyItems, dialog, previewMode])

	const onProgress = (p: Progress) => {
		console.log("Hanbe einen Progess", p)

		setProgressRevealed(true)
		setProgressFinished(false)
	}

	webViewEvents.registerMenuAction(onMenuAction)
	webViewEvents.registerProgresses(onProgress)

	// useEffect(() => {
	// 	const subscription = isWindows() ? progressChangedEvents.subscribe(e => {
	// 		else if (e.isFinished)
	// 			setProgressFinished(true)
	// 		else if (e.isDisposed) {
	// 			setProgress(0)
	// 			setProgressRevealed(false)
	// 		}
	// 		else 
	// 			setProgress(e.currentBytes/e.totalBytes)
	// 		setTotalMax(e.totalBytes)
	// 	}) : null

	// 	copyErrorSubscription.current?.unsubscribe()
	// 	copyErrorSubscription.current = copyErrorEvents.subscribe(err => showError(err, setErrorText, "Fehler beim Kopieren: "))

	showPreviewEvents.subscribe(set => {
		setShowViewer(set)
		showViewerRef.current = set
	})

	showHiddenEvents.subscribe(set => {
		setShowHidden(set)
	})

	useEffect(() => {
		folderLeft.current?.refresh(showHidden)
		folderRight.current?.refresh(showHidden)
	}, [showHidden])

	const onKeyDown = (evt: React.KeyboardEvent) => {
		if (evt.code == "Tab" && !evt.shiftKey) {
			getInactiveFolder()?.setFocus()
			evt.preventDefault()
			evt.stopPropagation()
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
			? previewMode == PreviewMode.Default
				? (<PictureViewer path={path.path} latitude={path.latitude} longitude={path.longitude} />)
				: previewMode == PreviewMode.Location && path.latitude && path.longitude
				? (<LocationViewer latitude={path.latitude} longitude={path.longitude} />)
				: path.latitude && path.longitude
				? <div className='bothViewer'>
						<PictureViewer path={path.path} latitude={path.latitude} longitude={path.longitude} />
						<LocationViewer latitude={path.latitude} longitude={path.longitude} />
					</div>	
				:(<PictureViewer path={path.path} latitude={path.latitude} longitude={path.longitude} />)
			: ext == ".mp3" || ext == ".mp4" || ext == ".mkv" || ext == ".wav"
			? (<MediaPlayer path={path.path} />)
			: ext == ".pdf"
			? (<FileViewer path={path.path} />)
			: ext == ".gpx"
			? (<TrackViewer path={path.path} />)
			: (<div></div>)
	}

	return (
		<>
			{ isWindows() && (<Titlebar progress={progress} progressFinished={progressFinished} progressRevealed={progressRevealed} totalSize={totalMax} 
				menu={(
				<Menu autoMode={false} onMenuAction={onMenuAction} 
				showHidden={showHidden} toggleShowHidden={toggleShowHiddenAndRefresh}
				showViewer={showViewer} toggleShowViewer={toggleShowViewer} />
			)} />) }
			<ViewSplit isHorizontal={true} firstView={VerticalSplitView} secondView={ViewerView} initialWidth={30} secondVisible={showViewer} />
			<Statusbar path={path.path} dirCount={itemCount.dirCount} fileCount={itemCount.fileCount}
				errorText={errorText} setErrorText={setErrorText} statusText={statusText} />
		</>
	)
})

export default Commander


