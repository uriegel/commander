import { TableRowItem } from "virtual-table-react"
import IconName, { IconNameType } from "../components/IconName"
import { Controller, ControllerResult, ControllerType, formatDateTime, formatSize, makeTableViewItems, measureRow } from "./controller"
import { FolderItem, GetItemResult, request } from "./requests"
import { ROOT } from "./root"

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
		getItems,
		onEnter: (path, item, keys) => 
			(item as FolderItem).isDirectory
				? ({
                	processed: false, 
                	pathToSet: path + '/' + (item as FolderItem).name // TODO Windows: \?
				}) 
				: (item as FolderItem).isParent && path.length > 1 // TODO Windows 
				?  ({
                	processed: false, 
                	pathToSet: path + '/' + (item as FolderItem).name
				}) 
				: (item as FolderItem).isParent && path.length == 1
				? ({
                	processed: false, 
                	pathToSet: ROOT
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