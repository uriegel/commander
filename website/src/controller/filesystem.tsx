import { SpecialKeys, TableColumns } from "virtual-table-react"
import { DialogHandle, ResultType } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import { getPlatform, Platform } from "../globals"
import { Controller, ControllerResult, ControllerType, ItemsType, OnEnterResult, addParent, formatDateTime, formatSize, formatVersion, getItemsType, sortItems } from "./controller"
import { GetExtendedItemsResult, GetItemsResult, IOError, RequestError, Version, webViewRequest } from "../requests/requests"
import { ROOT } from "./root"
import { extendedRename } from "./filesystemExtendedRename"
import { IconNameType } from "../enums"
import { DirectoryChangedEvent, DirectoryChangedType } from "../requests/events"

const platform = getPlatform()
const driveLength = platform == Platform.Windows ? 3: 1

const renderBaseRow = (item: FolderViewItem) => [
	(<IconName namePart={item.name} type={
			item.isParent
			? IconNameType.Parent
			: item.isDirectory
			? IconNameType.Folder
			: IconNameType.File}
		iconPath={item.iconPath} />),
	(<span className={item.exifData?.dateTime ? "exif" : "" } >{formatDateTime(item?.exifData?.dateTime ?? item?.time)}</span>),
	formatSize(item.size)
]

const renderRow = (item: FolderViewItem) => 
	platform == Platform.Windows 
	? renderBaseRow(item).concat(formatVersion(item.version))
	: renderBaseRow(item)

const getWindowsColumns = () => ({
	columns: [
		{ name: "Name", isSortable: true, subColumn: "Erw." },
		{ name: "Datum", isSortable: true },
		{ name: "Größe", isSortable: true, isRightAligned: true },
		{ name: "Version", isSortable: true}
	],
	getRowClasses,
	renderRow,
	draggable: true
})

const getLinuxColumns = () => ({
	columns: [
		{ name: "Name", isSortable: true, subColumn: "Erw." },
		{ name: "Datum", isSortable: true },
		{ name: "Größe", isSortable: true, isRightAligned: true }
	],
	getRowClasses,
	renderRow,
} as TableColumns<FolderViewItem>)

const appendLinuxPath = (path: string, subPath: string) => path != "/" ? `${path}/${subPath}` : `/${subPath}`

const appendWindowsPath = (path: string, subPath: string) => path.length == 3 ? `${path}${subPath}` : `${path}\\${subPath}`

export const getFileSystemController = (controller: Controller|null): ControllerResult =>
	controller?.type == ControllerType.FileSystem
	? ({ changed: false, controller })
    : ({ changed: true, controller: createFileSystemController()
})

const onFileEnter = (path: string, keys?: SpecialKeys) => 
	webViewRequest("onenter", { path, keys })
		.map(() => ({ processed: true }) as OnEnterResult)
	
const onShowDirectory = (path: string) => 
	webViewRequest("onshowdir", { path })
		.map(() => ({ processed: true }) as OnEnterResult)		
		
export const createFileSystemController = (): Controller => {
	let currentPath = ""
	return ({
		type: ControllerType.FileSystem,
		id: "file",
		getColumns: platform == Platform.Windows ? getWindowsColumns : getLinuxColumns,
		getExtendedItems,
		setExtendedItems,
		cancelExtendedItems,
		getItems: (id, path, showHiddenItems, sortIndex, sortDescending, mount) => 
			webViewRequest<GetItemsResult>("getfiles", { id, path, showHiddenItems, mount })
				.map(ok => {
					currentPath = ok.path
					return { ...ok, items: addParent(sortItems(ok.items, getSortFunction(sortIndex, sortDescending), true)) }
				}),
		updateItems,
		getPath: () => currentPath,
		onEnter: async ({ path, item, keys }) =>
			item.isParent && path.length > driveLength
			? ({
				processed: false,
				pathToSet: path + '/' + item.name,
				latestPath: path.extractSubPath()
			})
			: item.isParent && path.length == driveLength
			? ({
				processed: false,
				pathToSet: ROOT,
				latestPath: path
			})
			: item.isDirectory && keys.ctrl
			? await onShowDirectory(path.appendPath(item.name))
			: item.isDirectory && !keys.alt
			? ({
				processed: false,
				pathToSet: path + '/' + item.name
			})
			: await onFileEnter(path.appendPath(item.name), keys),
		sort,
		itemsSelectable: true,
		appendPath: platform == Platform.Windows ? appendWindowsPath : appendLinuxPath,
		rename,
		extendedRename: (controller: Controller, dialog: DialogHandle) => extendedRename(controller, dialog, false),
		renameAsCopy,
		createFolder,
		deleteItems,
		onSelectionChanged: () => { },
		cleanUp: () => { },
	})
}

const getRowClasses = (item: FolderViewItem) => 
	item.isHidden
		? ["hidden"]
		: []

const renameItem = (items: FolderViewItem[], sortIndex: number, sortDescending: boolean, evt: DirectoryChangedEvent) => 
	sort((items.findIndex(n => n.name == evt.oldName) >= 0
			? items.filter(n => n.name != evt.item.name)
			: items)
		.map(n => n.name == evt.oldName 
			? { ...n, name: evt.item.name, size: evt.item.size, time: evt.item.time, isHidden: evt.item.isHidden }
			: n),
		sortIndex, sortDescending)

const updateItems = (items: FolderViewItem[], sortIndex: number, sortDescending: boolean, evt: DirectoryChangedEvent) => 
	evt.type == DirectoryChangedType.Created
		? sort([...items, evt.item], sortIndex, sortDescending) 
		: evt.type == DirectoryChangedType.Changed
		? items.map(n => n.name == evt.item.name ? { ...n, size: evt.item.size, time: evt.item.time, isHidden: evt.item.isHidden } : n)  
		: evt.type == DirectoryChangedType.Deleted
		? items.filter(n => n.name != evt.item.name)
		: evt.type == DirectoryChangedType.Renamed
		? renameItem(items, sortIndex, sortDescending, evt)
		: null

// TODO GetRoot
// TODO getRoot when error &&	!dialog but statusbar??? {
// 		const res = await request<GetItemResult>("getfiles", {
// 			path: "root",
// 			showHiddenItems: showHidden,
// 			mount
// 		})

const sort = (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => 
	sortItems(items, getSortFunction(sortIndex, sortDescending), true) 

const checkExtendedItemsWindows = (items: FolderViewItem[]) => 
	items.find(n => {
		const check = n.name.toLowerCase()
		return check.endsWith(".jpg") 
			|| check.endsWith(".png") 
			|| check.endsWith(".exe") 
			|| check.endsWith(".dll")
	})

const checkExtendedItemsLinux = (items: FolderViewItem[]) => 
	items.find(n => {
		const check = n.name.toLowerCase()
		return check.endsWith(".jpg") || check.endsWith(".png")|| check.endsWith(".heic")
	})
const checkExtendedItems = 
	platform == Platform.Windows
		? checkExtendedItemsWindows
		: checkExtendedItemsLinux	

const getExtendedItems = async (id: string, path: string, items: FolderViewItem[]) => {
	if (!checkExtendedItems(items))
		throw new RequestError(IOError.Dropped, "")
		
	return await webViewRequest<GetExtendedItemsResult>("getextendeditems", {
		id,
		items: (items as FolderViewItem[]).map(n => n.name),
		path
	})
}		

const setExtendedItems = (items: FolderViewItem[], extended: GetExtendedItemsResult, sortColumn: number, sortDescending: boolean): FolderViewItem[] =>
	sort(items.map((n, i) => !extended.extendedItems[i].exifData && !extended.extendedItems[i].version
		? n
		: extended.extendedItems[i].exifData && !extended.extendedItems[i].version
		? {...n, exifData: extended.extendedItems[i].exifData || undefined }
		: !extended.extendedItems[i].exifData && extended.extendedItems[i].version
		? {...n, version: extended.extendedItems[i].version || undefined }
		: { ...n, version: extended.extendedItems[i].version || undefined, exifData: extended.extendedItems[i].exifData || undefined }), sortColumn, sortDescending)

const cancelExtendedItems = async (id: string) => {
	await webViewRequest("cancelextendeditems", { id })
}
		
export const getSortFunction = (index: number, descending: boolean) => {
	const ascDesc = (sortResult: number) => descending ? -sortResult : sortResult
	const sf = index == 0
		? (a: FolderViewItem, b: FolderViewItem) => a.name.localeCompare(b.name) 
		: index == 1
			? (a: FolderViewItem, b: FolderViewItem) => {	
				const aa = a.exifData?.dateTime ? a.exifData?.dateTime : a.time || ""
				const bb = b.exifData?.dateTime ? b.exifData?.dateTime : b.time || ""
				return aa.localeCompare(bb) 
			} 
		: index == 2
		? (a: FolderViewItem, b: FolderViewItem) => (a.size || 0) - (b.size || 0)
		: index == 3
		? (a: FolderViewItem, b: FolderViewItem) => compareVersion(a.version, b.version)
		: index == 10
		? (a: FolderViewItem, b: FolderViewItem) => a.name.getExtension().localeCompare(b.name.getExtension()) 
		: undefined
	
	return sf
		? (a: FolderViewItem, b: FolderViewItem) => ascDesc(sf(a, b))
		: undefined
}

const rename = async (path: string, item: FolderViewItem, dialog: DialogHandle) => {
	const getInputRange = () => {
		const pos = item.name.lastIndexOf(".")
		return (pos == -1)
			? [0, item.name.length]
			: [0, pos]
	}

	const res = await dialog.show({
		text: item.isDirectory ? "Möchtest Du das Verzeichnis umbenennen?" : "Möchtest Du die Datei umbenennen?",
		inputText: item.name,
		inputSelectRange: getInputRange(),
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	if (res.result != ResultType.Ok || !res.input)
		throw new RequestError(IOError.Dropped, "")
	const newName = res.input
	await webViewRequest("renameitem", { path, name: item.name, newName })
	return newName
}

const renameAsCopy = async (path: string, item: FolderViewItem, dialog: DialogHandle) => {
	const getInputRange = () => {
		const pos = item.name.lastIndexOf(".")
		return (pos == -1)
			? [0, item.name.length]
			: [0, pos]
	}

	if (item.isDirectory == false) {
		const res = await dialog.show({
			text: "Möchtest Du eine Kopie der Datei erstellen?",
			inputText: item.name,
			inputSelectRange: getInputRange(),
			btnOk: true,
			btnCancel: true,
			defBtnOk: true
		})
		if (res.result != ResultType.Ok)
			throw new RequestError(IOError.Dropped, "")
		const newName = res.input
		await webViewRequest("renameascopy", {
			path,
			name: item.name,
			newName
		})
	}
}

const createFolder = async (path: string, item: FolderViewItem, dialog: DialogHandle) => {
	const res = await dialog.show({
		text: "Neuen Ordner anlegen",
		inputText: !item.isParent ? item.name : "",
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	if (res.result != ResultType.Ok || !res.input)
		throw new RequestError(IOError.Dropped, "")
	const name = res.input
	await webViewRequest("createfolder", { path, name })
	return name
}

const deleteItems = async (path: string, items: FolderViewItem[], dialog: DialogHandle) => {

	const type = getItemsType(items)
	const text = type == ItemsType.Directory
		? "Möchtest Du das Verzeichnis löschen?"
		: type == ItemsType.Directories
		? "Möchtest Du die Verzeichnisse löschen?"
		: type == ItemsType.File
		? "Möchtest Du die Datei löschen?"
		: type == ItemsType.Files
		? "Möchtest Du die Dateien löschen?"		
		: "Möchtest Du die Verzeichnisse und Dateien löschen?"	
	
	const res = await dialog.show({
		text,
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	if (res.result != ResultType.Ok)
		throw new RequestError(IOError.Dropped, "")
	await webViewRequest("deleteitems", { path, names: items.map(n => n.name) })
}

export const compareVersion = (versionLeft?: Version, versionRight?: Version) =>
    !versionLeft
	? -1
	: !versionRight
	? 1
	: versionLeft.major != versionRight.major 
	? versionLeft.major - versionRight.major
	: versionLeft.minor != versionRight.minor
	? versionLeft.minor - versionRight.minor
	: versionLeft.patch != versionRight.patch
	? versionLeft.patch - versionRight.patch
	: versionLeft.build - versionRight.build

