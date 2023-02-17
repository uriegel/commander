import { TableRowItem } from "virtual-table-react"
import IconName, { IconNameType } from "../components/IconName"
import { getPlatform, Platform } from "../globals"
import { Controller, ControllerResult, ControllerType, extractSubPath, formatDateTime, formatSize, formatVersion, getExtension, makeTableViewItems, measureRow } from "./controller"
import { ExtendedItem, FolderItem, GetExtendedItemsResult, GetItemResult, request, Version } from "./requests"
import { ROOT } from "./root"

const platform = getPlatform()
const driveLength = platform == Platform.Windows ? 3: 1

const renderBaseRow = (props: TableRowItem) => {
	var item = props as FolderItem
	return [
		(<IconName namePart={item.name} type={item.isParent ? IconNameType.Parent : item.isDirectory ? IconNameType.Folder : IconNameType.File } iconPath={item.iconPath} />),
		(<span className={item.exifDate ? "exif" : "" } >{formatDateTime(item?.exifDate ?? item?.time)}</span>),
		formatSize(item.size)
	]
}

const renderRow = (props: TableRowItem) => 
	platform == Platform.Windows 
	? renderBaseRow(props).concat(formatVersion((props as FolderItem).version))
	: renderBaseRow(props)

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

const getColumns = platform == Platform.Windows ? getWindowsColumns : getLinuxColumns

export const getFileSystemController = (controller: Controller|null): ControllerResult =>
    controller?.type == ControllerType.FileSystem
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
		type: ControllerType.FileSystem, 
		getColumns, 
		getExtendedItems,
		setExtendedItems,
		getItems,
		onEnter: (path, item, keys) => 
			(item as FolderItem).isParent && path.length > driveLength 
			?  ({
				processed: false, 
				pathToSet: path + '/' + (item as FolderItem).name,
				latestPath: extractSubPath(path)

			}) 
			: (item as FolderItem).isParent && path.length == driveLength
			? ({
				processed: false, 
				pathToSet: ROOT,
				latestPath: path
			}) 
			: (item as FolderItem).isDirectory
			? ({
				processed: false, 
				pathToSet: path + '/' + (item as FolderItem).name 
			}) 
					
			: { processed: true },
		sort
		}
	})
	
const getRowClasses = (item: TableRowItem) => 
	(item as FolderItem).isHidden
		? ["hidden"]
		: []
	

const getItems = async (path: string, sortIndex: number, sortDescending: boolean) => {
	const res = await request<GetItemResult>("getfiles", {
		path,
		showHiddenItems: true
	})
	return { ...res, items: makeTableViewItems(res.items, getSortFunction(sortIndex, sortDescending)) }
}

const sort = (items: TableRowItem[], sortIndex: number, sortDescending: boolean) => 
	makeTableViewItems(items, getSortFunction(sortIndex, sortDescending), false) 


const checkExtendedItemsWindows = (items: FolderItem[]) => 
	items.find(n => {
		const check = n.name.toLowerCase()
		return check.endsWith(".jpg") 
			|| check.endsWith(".png") 
			|| check.endsWith(".exe") 
			|| check.endsWith(".dll")
	})

const checkExtendedItemsLinux = (items: FolderItem[]) => 
	items.find(n => {
		const check = n.name.toLowerCase()
		return check.endsWith(".jpg") || check.endsWith(".png")
	})

const checkExtendedItems = 
	platform == Platform.Windows
		? checkExtendedItemsWindows
		: checkExtendedItemsLinux

const getExtendedItems = async (path: string, items: TableRowItem[]): Promise<GetExtendedItemsResult> => 
	checkExtendedItems(items as FolderItem[])
		? request<GetExtendedItemsResult>("getextendeditems", {
			items: (items as FolderItem[]).map(n => n.name),
			path
		})
		: { path: "", extendedItems: [] }

const setExtendedItems = (items: TableRowItem[], extendedItems: ExtendedItem[]) => 
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
		? (a: TableRowItem, b: TableRowItem) => (a as FolderItem).name.localeCompare((b as FolderItem).name) 
		: index == 1
			? (a: TableRowItem, b: TableRowItem) => {
				let afi = a as FolderItem
				let bfi = b as FolderItem
				let aa = afi.exifDate ? afi.exifDate : afi.time || ""
				let bb = bfi.exifDate ? bfi.exifDate : bfi.time || ""
				return aa.localeCompare(bb) 
			} 
		: index == 2
		? (a: TableRowItem, b: TableRowItem) => ((a as FolderItem).size || 0) - ((b as FolderItem).size || 0)
		: index == 3
		? (a: TableRowItem, b: TableRowItem) => compareVersion((a as FolderItem).version, (b as FolderItem).version)
		: index == 10
		? (a: TableRowItem, b: TableRowItem) => getExtension((a as FolderItem).name).localeCompare(getExtension((b as FolderItem).name)) 
		: undefined
	
	return sf
		? (a: TableRowItem, b: TableRowItem) => ascDesc(sf(a, b))
		: undefined
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


