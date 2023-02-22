import { Result, showDialog } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import { getPlatform, Platform } from "../globals"
import { addParent, Controller, ControllerResult, ControllerType, extractSubPath, formatDateTime, formatSize, formatVersion, getExtension, measureRow, sortItems } from "./controller"
import { ExtendedItem, GetExtendedItemsResult, GetItemResult, IOErrorResult, request, Version } from "./requests"
import { ROOT } from "./root"

const platform = getPlatform()
const driveLength = platform == Platform.Windows ? 3: 1

const renderBaseRow = (item: FolderViewItem) => [
		(<IconName namePart={item.name} type={item.isParent ? IconNameType.Parent : item.isDirectory ? IconNameType.Folder : IconNameType.File } iconPath={item.iconPath} />),
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
	measureRow,
})

const getLinuxColumns = () => ({
	columns: [
		{ name: "Name", isSortable: true, subColumn: "Erw." },
		{ name: "Datum", isSortable: true },
		{ name: "Größe", isSortable: true, isRightAligned: true }
	],
	getRowClasses,
	renderRow,
	measureRow
})

const appendLinuxPath = (path: string, subPath: string) => `${path}/${subPath}`

const appendWindowsPath = (path: string, subPath: string) => path.length == 3 ? `${path}${subPath}` : `${path}\\${subPath}`

export const getFileSystemController = (controller: Controller|null): ControllerResult =>
    controller?.type == ControllerType.FileSystem
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
		type: ControllerType.FileSystem, 
		getColumns: platform == Platform.Windows ? getWindowsColumns : getLinuxColumns, 
		getExtendedItems,
		setExtendedItems,
		getItems,
		onEnter: (path, item, keys) => 
			item.isParent && path.length > driveLength 
			?  ({
				processed: false, 
				pathToSet: path + '/' + item.name,
				latestPath: extractSubPath(path)

			}) 
			: item.isParent && path.length == driveLength
			? ({
				processed: false, 
				pathToSet: ROOT,
				latestPath: path
			}) 
			: item.isDirectory
			? ({
				processed: false, 
				pathToSet: path + '/' + item.name 
			}) 
					
			: { processed: true },
		sort,
		itemsSelectable: true,
		appendPath: platform == Platform.Windows ? appendWindowsPath : appendLinuxPath,
		rename,
		createFolder
	}
})
	
const getRowClasses = (item: FolderViewItem) => 
	item.isHidden
		? ["hidden"]
		: []
	

const getItems = async (path: string, showHidden: boolean, sortIndex: number, sortDescending: boolean) => {
	const res = await request<GetItemResult>("getfiles", {
		path,
		showHiddenItems: showHidden
	})
	return { ...res, items: addParent(sortItems(res.items, getSortFunction(sortIndex, sortDescending))) }
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

const getExtendedItems = async (path: string, items: FolderViewItem[]): Promise<GetExtendedItemsResult> => 
	checkExtendedItems(items)
		? request<GetExtendedItemsResult>("getextendeditems", {
			items: (items as FolderViewItem[]).map(n => n.name),
			path
		})
		: { path: "", extendedItems: [] }

const setExtendedItems = (items: FolderViewItem[], extendedItems: ExtendedItem[]) => 
	items.map((n, i) => !extendedItems[i].date && !extendedItems[i].version
		? n
		: extendedItems[i].date && !extendedItems[i].version
		? {...n, exifDate: extendedItems[i].date} 
		: !extendedItems[i].date && extendedItems[i].version
		? {...n, version: extendedItems[i].version} 
		: {...n, version: extendedItems[i].version, exifDate: extendedItems[i].date })
		 
const getSortFunction = (index: number, descending: boolean) => {
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
		? (a: FolderViewItem, b: FolderViewItem) => getExtension(a.name).localeCompare(getExtension(b.name)) 
		: undefined
	
	return sf
		? (a: FolderViewItem, b: FolderViewItem) => ascDesc(sf(a, b))
		: undefined
}

const rename = async (path: string, item: FolderViewItem) => {
	const getInputRange = () => {
		const pos = item.name.lastIndexOf(".")
		return (pos == -1)
			? [0, item.name.length]
			: [0, pos]
	}

	const isDir = item.isDirectory
	const result = await showDialog({
		text: isDir ? "Möchtest Du das Verzeichnis umbenennen?" : "Möchtest Du die Datei umbenennen?",
		inputText: item.name,
		inputSelectRange: getInputRange(),
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	return result.result == Result.Ok
		? (await request<IOErrorResult>("renameitem", {
				path,
				name: item.name,
				newName:  result.input ?? ""
			})).error
		: null
}

const createFolder = async (path: string, item: FolderViewItem) => {
	const result = await showDialog({
		text: "Neuen Ordner anlegen",
		inputText: !item.isParent ? item.name : "",
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	return result.result == Result.Ok
		? (await request<IOErrorResult>("createfolder", {
				path,
				name: result.input ?? "",
			})).error
		: null
}

const compareVersion = (versionLeft?: Version, versionRight?: Version) =>
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
