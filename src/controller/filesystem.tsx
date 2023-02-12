import { TableRowItem } from "virtual-table-react"
import IconName, { IconNameType } from "../components/IconName"
import { ControllerType, formatDateTime, formatSize } from "./controller"
import { FolderItem, GetItemResult, request } from "./requests"

const renderRow = (props: TableRowItem) => {
	var item = props as FolderItem
	return [
		(<IconName namePart={item.name} type={item.isParent ? IconNameType.Parent : IconNameType.Folder} />),
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
	measureRow: () => (<IconName namePart="Measure g" type={IconNameType.Folder} />),
})

export const createFileSystemController = () => ({ type: ControllerType.FileSystem, getColumns })

export const getItems = async (path: string) => {
	return await request<GetItemResult>("getfiles", {
		path,
		showHiddenItems: true
	})
}