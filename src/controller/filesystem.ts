import { TableRowItem } from "virtual-table-react"
import { ControllerType, formatDateTime, formatSize } from "./controller"
import { FolderItem, GetItemResult, request } from "./requests"

const getColumns = () => ({
	columns: [
		{ name: "Name", isSortable: true, subColumn: "Ext." },
		{ name: "Date" },
		{ name: "Größe", isRightAligned: true }
	],
	renderRow: (props: TableRowItem) => {
		var items = props as FolderItem
		return [
			items.name,
			formatDateTime(items.time),
			formatSize(items.size)
		]
	},
	measureRow: () => `Measure`
})

export const createFileSystemController = () => ({ type: ControllerType.FileSystem, getColumns })

export const getItems = async (path: string) => {
	return await request<GetItemResult>("getfiles", {
		path,
		showHiddenItems: true
	})
}