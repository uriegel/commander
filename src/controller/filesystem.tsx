import { SpecialKeys, TableColumns } from "virtual-table-react"
import { DialogHandle, ResultType } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import { getPlatform, Platform } from "../globals"
import { Controller, ControllerResult, ControllerType, OnEnterResult, addParent, formatDateTime, formatSize, formatVersion, sortItems } from "./controller"
import { GetExtendedItemsResult, GetItemsError, GetItemsResult, IOError, IOErrorResult, request, Version } from "../requests/requests"
import { ROOT } from "./root"
import { extendedRename } from "./filesystemExtendedRename"
import { IconNameType } from "../enums"
import { AsyncResult, Err, ErrorType, Nothing, Ok, jsonPost, nothing } from "functional-extensions"
import { DirectoryChangedEvent, DirectoryChangedType } from "../requests/events"

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
} as TableColumns<FolderViewItem>)

const appendLinuxPath = (path: string, subPath: string) => `${path}/${subPath}`

const appendWindowsPath = (path: string, subPath: string) => path.length == 3 ? `${path}${subPath}` : `${path}\\${subPath}`

export const getFileSystemController = (controller: Controller|null): ControllerResult =>
	controller?.type == ControllerType.FileSystem
	? ({ changed: false, controller })
    : ({ changed: true, controller: createFileSystemController()
})

const onFileEnter = (path: string, keys?: SpecialKeys) => {
	request("onenter", {path, keys})
	return  ({ processed: true })
}
		
export const createFileSystemController = (): Controller => {
	let currentPath = ""
	return ({
		type: ControllerType.FileSystem,
		id: "file",
		getColumns: platform == Platform.Windows ? getWindowsColumns : getLinuxColumns,
		getExtendedItems,
		setExtendedItems,
		cancelExtendedItems,
		getItems: (id, path, showHidden, sortIndex, sortDescending, mount) => {
			const res = getItems(id, path, showHidden, sortIndex, sortDescending, mount)
			res.map(res => {
				currentPath = res.path
				return res
			})
			return res
		},
		updateItems,
		getPath: () => currentPath,
		onEnter: ({ path, item, keys }) =>
			AsyncResult.from(new Ok<OnEnterResult, ErrorType>(
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
						: item.isDirectory && !keys.alt
							? ({
								processed: false,
								pathToSet: path + '/' + item.name
							})
							: onFileEnter(path.appendPath(item.name), keys))),
		sort,
		itemsSelectable: true,
		appendPath: platform == Platform.Windows ? appendWindowsPath : appendLinuxPath,
		rename,
		extendedRename: (controller: Controller, dialog: DialogHandle | null) => extendedRename(controller, dialog, false),
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

const getItems = (id: string, path: string, showHiddenItems: boolean, sortIndex: number, sortDescending: boolean, mount: boolean) => 
	jsonPost<GetItemsResult, GetItemsError>({ method: "getfiles", payload: { id, path, showHiddenItems, mount } })
		.map(ok => ({ ...ok, items: addParent(sortItems(ok.items, getSortFunction(sortIndex, sortDescending))) }))

const updateItems = (items: FolderViewItem[], showHidden: boolean, sortIndex: number, sortDescending: boolean, evt: DirectoryChangedEvent) => 
	evt.type == DirectoryChangedType.Created && (!evt.item.isHidden || showHidden)
		? sort([...items, evt.item], sortIndex, sortDescending) 
		: evt.type == DirectoryChangedType.Changed && (!evt.item.isHidden || showHidden)
		? items.map(n => n.name == evt.item.name ? { ...n, size: evt.item.size, time: evt.item.time } : n)  
		: evt.type == DirectoryChangedType.Deleted
		? items.filter(n => n.name != evt.item.name)
		: evt.type == DirectoryChangedType.Renamed
		? items.map(n => n.name == evt.oldName
			? { ...n, name: evt.item.name, size: evt.item.size, time: evt.item.time }
			: n) 
		: null

// TODO GetRoot
// TODO getRoot when error &&	!dialog but statusbar??? {
// 		const res = await request<GetItemResult>("getfiles", {
// 			path: "root",
// 			showHiddenItems: showHidden,
// 			mount
// 		})

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

const getExtendedItems = (id: string, path: string, items: FolderViewItem[]): AsyncResult<GetExtendedItemsResult, ErrorType> => 
	checkExtendedItems(items)
		? jsonPost<GetExtendedItemsResult, ErrorType>({
			method: "getextendeditems",
			payload: {
				id,
				items: (items as FolderViewItem[]).map(n => n.name),
				path
			}
		}) 
		: AsyncResult.from(new Err<GetExtendedItemsResult, ErrorType>({status: IOError.Canceled, statusText: ""}))

const setExtendedItems = (items: FolderViewItem[], extended: GetExtendedItemsResult, sortColumn: number, sortDescending: boolean): FolderViewItem[] => 
	sort(items.map((n, i) => !extended.exifTimes[i] && (extended.versions && !extended.versions[i])
		? n
		: extended.exifTimes[i] && (extended.versions && !extended.versions[i])
		? {...n, exifDate: extended.exifTimes[i] || undefined } 
		: !extended.exifTimes[i] && (extended.versions && extended.versions[i])
		? {...n, version: extended.versions[i] || undefined } 
		: { ...n, version: (extended.versions && extended.versions[i] || undefined), exifDate: extended.exifTimes[i] || undefined }), sortColumn, sortDescending)
		
const cancelExtendedItems = (id: string) => 
	jsonPost<Nothing, ErrorType>({ method: "cancelextendeditems", payload: { id } })
		
export const getSortFunction = (index: number, descending: boolean) => {
	const ascDesc = (sortResult: number) => descending ? -sortResult : sortResult
	const sf = index == 0
		? (a: FolderViewItem, b: FolderViewItem) => a.name.localeCompare(b.name) 
		: index == 1
			? (a: FolderViewItem, b: FolderViewItem) => {	
				const aa = a.exifDate ? a.exifDate : a.time || ""
				const bb = b.exifDate ? b.exifDate : b.time || ""
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

const rename = (path: string, item: FolderViewItem, dialog: DialogHandle) => {
	const getInputRange = () => {
		const pos = item.name.lastIndexOf(".")
		return (pos == -1)
			? [0, item.name.length]
			: [0, pos]
	}

	return dialog.showDialog<string, ErrorType>({
		text: item.isDirectory ? "Möchtest Du das Verzeichnis umbenennen?" : "Möchtest Du die Datei umbenennen?",
		inputText: item.name,
		inputSelectRange: getInputRange(),
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	}, res => res.result == ResultType.Ok && res.input
		? new Ok(res.input)
		: new Err({ status: IOError.Canceled, statusText: "" }))
		.bindAsync(newName => jsonPost<Nothing, ErrorType>({ method: "renameitem", payload: { path, name: item.name, newName } })
								.map(() => newName))
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
	return result?.result == ResultType.Ok
		? (await request<IOErrorResult>("renameandcopy", {
				path,
				name: item.name,
				newName:  result.input ?? ""
			}, dialog)).error ?? null
		: null
}

const createFolder = (path: string, item: FolderViewItem, dialog: DialogHandle) => 
	dialog.showDialog<string, ErrorType>({
		text: "Neuen Ordner anlegen",
		inputText: !item.isParent ? item.name : "",
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	}, res => res.result == ResultType.Ok && res.input
	? new Ok(res.input)
	: new Err({ status: IOError.Canceled, statusText: "" }))
		.bindAsync(name => jsonPost<Nothing, ErrorType>({ method: "createfolder", payload: { path, name } })
							.map(() => name))

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

const deleteItems = (path: string, items: FolderViewItem[], dialog: DialogHandle) => {

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
	
	return dialog.showDialog<Nothing, ErrorType>({
			text,
			btnOk: true,
			btnCancel: true,
			defBtnOk: true
		}, res => res.result == ResultType.Ok
		? new Ok(nothing)
		: new Err({ status: IOError.Canceled, statusText: "" }))
			.bindAsync(() => jsonPost<Nothing, ErrorType>({ method: "deleteitems", payload: { path, names: items.map(n => n.name) }}))
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

