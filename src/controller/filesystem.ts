import { TableRowItem } from "virtual-table-react"
import { ControllerType } from "./controller"
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
			`${items.time}`,
			`${items.size}`
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