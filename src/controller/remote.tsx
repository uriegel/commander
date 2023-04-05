import { TableColumns } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import { GetItemResult, request } from "../requests/requests"
import { addParent, Controller, ControllerResult, ControllerType, formatDateTime, formatSize, sortItems } from "./controller"
import { getSortFunction } from "./filesystem"
import { ROOT } from "./root"

export const REMOTE = "remote"

const renderRow = (item: FolderViewItem) => [
	(<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isDirectory
        ? IconNameType.Folder
        : IconNameType.File}
        iconPath={item.iconPath} />),
    formatDateTime(item?.time),
    formatSize(item.size)
]

const getRowClasses = (item: FolderViewItem) => 
	item.isHidden
		? ["hidden"]
		: []

const getColumns = () => ({
	columns: [
		{ name: "Name", isSortable: true, subColumn: "Erw." },
		{ name: "Datum", isSortable: true },
		{ name: "Größe", isSortable: true, isRightAligned: true }
	],
	getRowClasses,
	renderRow,
	draggable: true
} as TableColumns<FolderViewItem>)

const getItems = async (path: string, showHidden: boolean, sortIndex: number, sortDescending: boolean) => {
	const res = await request<GetItemResult>("getremotefiles", {
		path,
		showHiddenItems: showHidden
	})
	return { ...res, items: addParent(sortItems(res.items, getSortFunction(sortIndex, sortDescending))) }
}

export const getRemoteController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Remote
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Remote, 
        id: REMOTE,
        getColumns,
        getItems,
        getExtendedItems: async () => ({ path: "", exifTimes: [], versions: [] }),
        setExtendedItems: items=>items,
		onEnter: (path, item, keys) => 
			item.isParent && path.split("/").length - 1 == 2
			?  ({
				processed: false, 
				pathToSet: ROOT,
				latestPath: path
			}) 
			: item.isParent
			? ({
				processed: false, 
				pathToSet: path.appendPath(item.name),
				latestPath: path.extractSubPath()
			}) 
			: item.isDirectory
			? ({
				processed: false, 
				pathToSet: path.appendPath(item.name)
			}) 
			: { processed: true },
        sort: (items: FolderViewItem[]) => items,
        itemsSelectable: true,
        appendPath: (path: string, subPath: string) => subPath,
        rename: async () => null,
        createFolder: async () => null,
        deleteItems: async () => null,
    }})

