import { TableRowItem } from "virtual-table-react"
import IconName, { IconNameType } from "../components/IconName"
import { Controller, ControllerResult, ControllerType, formatDateTime, formatSize, makeTableViewItems, measureRow } from "./controller"
import { FolderItem, GetItemResult, request } from "./requests"

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
		onEnter: (item, keys) => ({ processed: true})
	}})

const getItems = async (path?: string) => {
	const res = await request<GetItemResult>("getfiles", {
		path: path ?? "",
		showHiddenItems: true
	})
	return { ...res, items: makeTableViewItems(res.items)}
}