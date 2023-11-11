import { SpecialKeys, TableColumns } from "virtual-table-react"
import { DialogHandle, Result } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import { getPlatform, Platform } from "../globals"
import { addParent, Controller, ControllerResult, ControllerType, formatDateTime, formatSize, formatVersion, sortItems } from "./controller"
import { GetExtendedItemsResult, GetItemResult, IOError, IOErrorResult, request, Version } from "../requests/requests"
import { ROOT } from "./root"
import { extendedRename } from "./filesystemExtendedRename"
import Credentials, { CredentialsProps } from "../components/dialogparts/Credentials"

export enum ItemsType {
	Directories,
	Directory,
	Files,
	File,
	All
}

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
	(<span className={item.exifDate ? "exif" : "" } >{formatDateTime(item?.exifDate ?? item?.time)}</span>),
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
	draggable: true
} as TableColumns<FolderViewItem>)

const appendLinuxPath = (path: string, subPath: string) => `${path}/${subPath}`

const appendWindowsPath = (path: string, subPath: string) => path.length == 3 ? `${path}${subPath}` : `${path}\\${subPath}`

export const getFileSystemController = async (controller: Controller|null): Promise<ControllerResult> =>
	controller?.type == ControllerType.FileSystem
	? ({ changed: false, controller })
    : ({ changed: true, controller: createFileSystemController()
})

const onFileEnter = (path: string, keys?: SpecialKeys) => {
	request("onenter", {path, keys})
	return  ({ processed: true })
}
		
export const createFileSystemController = (): Controller => ({
	type: ControllerType.FileSystem, 
	id: "file",
	getColumns: platform == Platform.Windows ? getWindowsColumns : getLinuxColumns, 
	getExtendedItems,
	setExtendedItems,
	cancelExtendedItems,
	getItems,
	onEnter: async ({path, item, keys}) => 
	item.isParent && path.length > driveLength 
	?  ({
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
	: item.isDirectory && !keys.alt 
	? ({
		processed: false, 
		pathToSet: path + '/' + item.name 
	}) 
	: onFileEnter(path.appendPath(item.name), keys),
sort,
	itemsSelectable: true,
	appendPath: platform == Platform.Windows ? appendWindowsPath : appendLinuxPath,
	rename,
	extendedRename: (controller: Controller, dialog: DialogHandle | null) => extendedRename(controller, dialog, false),
	renameAsCopy,
	createFolder,
	deleteItems,
	onSelectionChanged: () => { },
	cleanUp: () => { }
})

const getRowClasses = (item: FolderViewItem) => 
	item.isHidden
		? ["hidden"]
		: []

const getItems = async (path: string, showHidden: boolean, sortIndex: number, sortDescending: boolean, mount: boolean, dialog: DialogHandle | null)
		: Promise<GetItemResult> => {
	const res = await request<GetItemResult>("getfiles", {
		path,
		showHiddenItems: showHidden,
		mount
	})
	if (res.error != IOError.AccessDenied)
		return { ...res, items: addParent(sortItems(res.items, getSortFunction(sortIndex, sortDescending))) }
	else if (!dialog) {
		const res = await request<GetItemResult>("getfiles", {
			path: "root",
			showHiddenItems: showHidden,
			mount
		})
		return { ...res, items: addParent(sortItems(res.items, getSortFunction(sortIndex, sortDescending))) }
	} else 
		return await getItemsWithAccess(dialog, path)
			? await getItems(path, showHidden, sortIndex, sortDescending, mount, dialog)
			: { items: [], dirCount: 0, fileCount: 0, path, error: IOError.AccessDenied }
}

const sort = (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => 
	sortItems(items, getSortFunction(sortIndex, sortDescending)) 

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
		return check.endsWith(".jpg") || check.endsWith(".png")
	})

const checkExtendedItems = 
	platform == Platform.Windows
		? checkExtendedItemsWindows
		: checkExtendedItemsLinux

const getExtendedItems = async (id: string, path: string, items: FolderViewItem[]): Promise<GetExtendedItemsResult> => 
	checkExtendedItems(items)
		? request<GetExtendedItemsResult>("getextendeditems", {
			id,
			items: (items as FolderViewItem[]).map(n => n.name),
			path
		})
		: { path: "", versions: [], exifTimes: [] }

const cancelExtendedItems = async (id: string): Promise<void> => {
	await request<IOErrorResult>("cancelextendeditems", { id })
}
	
const setExtendedItems = (items: FolderViewItem[], extended: GetExtendedItemsResult):FolderViewItem[] => 
	items.map((n, i) => !extended.exifTimes[i] && (extended.versions && !extended.versions[i])
		? n
		: extended.exifTimes[i] && (extended.versions && !extended.versions[i])
		? {...n, exifDate: extended.exifTimes[i] || undefined } 
		: !extended.exifTimes[i] && (extended.versions && extended.versions[i])
		? {...n, version: extended.versions[i] || undefined } 
		: {...n, version: (extended.versions && extended.versions[i] || undefined), exifDate: extended.exifTimes[i] || undefined })
		 
export const getSortFunction = (index: number, descending: boolean) => {
	const ascDesc = (sortResult: number) => descending ? -sortResult : sortResult
	const sf = index == 0
		? (a: FolderViewItem, b: FolderViewItem) => a.name.localeCompare(b.name) 
		: index == 1
			? (a: FolderViewItem, b: FolderViewItem) => {	
				let aa = a.exifDate ? a.exifDate : a.time || ""
				let bb = b.exifDate ? b.exifDate : b.time || ""
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

const rename = async (path: string, item: FolderViewItem, dialog: DialogHandle|null) => {
	const getInputRange = () => {
		const pos = item.name.lastIndexOf(".")
		return (pos == -1)
			? [0, item.name.length]
			: [0, pos]
	}

	const isDir = item.isDirectory
	const result = await dialog?.show({
		text: isDir ? "Möchtest Du das Verzeichnis umbenennen?" : "Möchtest Du die Datei umbenennen?",
		inputText: item.name,
		inputSelectRange: getInputRange(),
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	return result?.result == Result.Ok
		? (await request<IOErrorResult>("renameitem", {
				path,
				name: item.name,
				newName:  result.input ?? ""
			}, dialog)).error ?? null
		: null
}

const renameAsCopy = async (path: string, item: FolderViewItem, dialog: DialogHandle|null) => {
	const getInputRange = () => {
		const pos = item.name.lastIndexOf(".")
		return (pos == -1)
			? [0, item.name.length]
			: [0, pos]
	}

	if (item.isDirectory)
		return null

	const result = await dialog?.show({
		text: "Möchtest Du eine Kopie der Datei erstellen?",
		inputText: item.name,
		inputSelectRange: getInputRange(),
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	return result?.result == Result.Ok
		? (await request<IOErrorResult>("renameandcopy", {
				path,
				name: item.name,
				newName:  result.input ?? ""
			}, dialog)).error ?? null
		: null
}

const createFolder = async (path: string, item: FolderViewItem, dialog: DialogHandle | null) => {
	const result = await dialog?.show({
		text: "Neuen Ordner anlegen",
		inputText: !item.isParent ? item.name : "",
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	return result?.result == Result.Ok
		? (await request<IOErrorResult>("createfolder", {
				path,
				name: result.input ?? "",
			}, dialog)).error ?? null
		: null
}

export const getItemsType = (items: FolderViewItem[]): ItemsType => {
	const dirs = items.filter(n => n.isDirectory)
	const files = items.filter(n => !n.isDirectory)
	return dirs.length == 0
		? files.length > 1
		? ItemsType.Files
		: ItemsType.File
		: dirs.length == 1
		? files.length != 0
		? ItemsType.All
		: ItemsType.Directory
		: dirs.length > 1
		? files.length != 0
		? ItemsType.All
		: ItemsType.Directories
		: ItemsType.All
}

const deleteItems = async (path: string, items: FolderViewItem[], dialog: DialogHandle|null) => {

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
	
	const result = await dialog?.show({
		text,
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	return result?.result == Result.Ok
	 	? (await request<IOErrorResult>("deleteitems", {
	 			path,
	 			names: items.map(n => n.name),
	 		}, dialog)).error ?? null
	 	: null
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

const getItemsWithAccess = async (dialog: DialogHandle, path: string) => {
	while (true) {
		let name = ""
		let password = ""
		const result = await dialog?.show({
			text: "Bitte Zugangsdaten eingeben:",
			extension: Credentials,
			extensionProps: { name, password },
			onExtensionChanged: (e: CredentialsProps) => {
				name = e.name
				password = e.password
			},				
			btnOk: true,
			btnCancel: true,
			defBtnOk: true
		})
		if (result?.result == Result.Cancel)
			break
		var res = await request<IOErrorResult>("elevatedrive", { path, name, password })	
		if (!res.error) 
			return true
		else if (res.error == IOError.NetNameNotFound)
			await dialog?.show({
				text: "Netzwerkname nicht gefunden",
				btnOk: true})
	}
	return false
}	