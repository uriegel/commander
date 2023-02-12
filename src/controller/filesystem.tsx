import { TableRowItem } from "virtual-table-react"
import IconName from "../components/IconName"
import { ControllerType, formatDateTime, formatSize } from "./controller"
import { FolderItem, GetItemResult, request } from "./requests"

const getColumns = () => ({
	columns: [
		{ name: "Name", isSortable: true, subColumn: "Ext." },
		{ name: "Date" },
		{ name: "Größe", isRightAligned: true }
	],
	renderRow: (props: TableRowItem) => {
		var item = props as FolderItem
		return [
			(<IconName namePart={item.name} />),
			formatDateTime(item.time),
			formatSize(item.size)
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