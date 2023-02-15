import { TableRowItem } from "virtual-table-react"
import IconName, { IconNameType } from "../components/IconName"
import { getPlatform, Platform } from "../globals"
import { Controller, ControllerResult, ControllerType, extractSubPath, formatDateTime, formatSize, makeTableViewItems, measureRow } from "./controller"
import { FolderItem, GetExtendedItemsResult, GetItemResult, request } from "./requests"
import { ROOT } from "./root"

const platform = getPlatform()
const driveLength = platform == Platform.Windows ? 3: 1

const renderRow = (props: TableRowItem) => {
	var item = props as FolderItem
	return [
		(<IconName namePart={item.name} type={item.isParent ? IconNameType.Parent : item.isDirectory ? IconNameType.Folder : IconNameType.File } iconPath={item.iconPath} />),
		formatDateTime(item.time),
		formatSize(item.size)
	]
}

const getColumns = () => ({
	columns: [
		{ name: "Name", isSortable: true, subColumn: "Erw." },
		{ name: "Datum" },
		{ name: "Größe", isRightAligned: true }
	],
	renderRow,
	measureRow
})

export const getFileSystemController = (controller: Controller|null): ControllerResult =>
    controller?.type == ControllerType.FileSystem
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
		type: ControllerType.FileSystem, 
		getColumns, 
		getExtendedItems,
		getItems,
		onEnter: (path, item, keys) => 
			(item as FolderItem).isDirectory
				? ({
                	processed: false, 
                	pathToSet: path + '/' + (item as FolderItem).name 
				}) 
				: (item as FolderItem).isParent && path.length > driveLength 
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
				: { processed: true }
	}})

const getItems = async (path?: string) => {
	const res = await request<GetItemResult>("getfiles", {
		path: path ?? "",
		showHiddenItems: true
	})
	return { ...res, items: makeTableViewItems(res.items)}
}

const checkExtendedItemsWindows = (items: FolderItem[]) => 
	items.find(n => {
		const check = n.name.toLowerCase()
		return check.endsWith(".jpg") || check.endsWith(".png")
	})

const checkExtendedItemsLinux = checkExtendedItemsWindows

const checkExtendedItems = 
	platform == Platform.Windows
		? checkExtendedItemsWindows
		: checkExtendedItemsLinux

const getExtendedItems = async (path: string, items: TableRowItem[]): Promise<TableRowItem[]> => 
	checkExtendedItems(items as FolderItem[])
		? request<GetExtendedItemsResult>("getextendeditems", {
			items: (items as FolderItem[]).map(n => n.name),
			path
		})
		: []


