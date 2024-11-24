import { TableColumns } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import { Controller, ControllerResult, ControllerType, ItemsType, addParent, formatDateTime, formatSize, getItemsType, sortItems } from "./controller"
import { getSortFunction } from "./filesystem"
import { REMOTES } from "./remotes"
import { IconNameType } from "../enums"
import { GetItemsResult, IOError, RequestError, webViewRequest } from "../requests/requests"
import { DialogHandle, ResultType } from "web-dialog-react"

export const REMOTE = "remote"

const renderRow = (item: FolderViewItem) => [
	(<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isDirectory
        ? IconNameType.Folder
        : IconNameType.File}
        iconPath={item.name.getExtension()} />),
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
	renderRow
} as TableColumns<FolderViewItem>)

const sort = (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => 
	sortItems(items, getSortFunction(sortIndex, sortDescending), true) 

const deleteItems = async (path: string, items: FolderViewItem[], dialog: DialogHandle) => {

	const type = getItemsType(items)
	const text = type == ItemsType.Directory
		? "Möchtest Du das Verzeichnis löschen?"
		: type == ItemsType.Directories
		? "Möchtest Du die Verzeichnisse löschen?"
		: type == ItemsType.File
		? "Möchtest Du die Datei löschen?"
		: type == ItemsType.Files
		? "Möchtest Du die Dateien löschen?"		
		: "Möchtest Du die Verzeichnisse und Dateien löschen?"	

	const res = await dialog.show({
		text,
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
		
	if (res.result != ResultType.Ok)
		throw new RequestError(IOError.Dropped, "")

	await webViewRequest("deleteitemsremote", { path, names: items.map(n => n.name) })
}

const createFolder = async (path: string, item: FolderViewItem, dialog: DialogHandle) => {
	const res = await dialog.show({
		text: "Neuen Ordner anlegen",
		inputText: !item.isParent ? item.name : "",
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	if (res.result != ResultType.Ok || !res.input)
		throw new RequestError(IOError.Dropped, "")
			
	const name = res.input
	await webViewRequest("createdirectoryremote", { path: path.appendPath(name) })
	return name
}

export const getRemoteController = (controller: Controller | null): ControllerResult => {
	let currentPath = ""
	return controller?.type == ControllerType.Remote
		? ({ changed: false, controller })
		: ({
			changed: true, controller: {
				type: ControllerType.Remote,
				id: REMOTE,
				getColumns,
				getItems: (id, path, showHiddenItems, sortIndex, sortDescending) =>
					webViewRequest<GetItemsResult>("getremotefiles", { id, path, showHiddenItems })
						.map(ok => {
							currentPath = ok.path
							return { ...ok, items: addParent(sortItems(ok.items, getSortFunction(sortIndex, sortDescending))) }
						}),
				updateItems: () => null,
				getPath: () => currentPath,
				getExtendedItems: () => { throw new RequestError(IOError.Dropped, "") },
				setExtendedItems: items => items,
				cancelExtendedItems: async () => { },
				onEnter: async ({ path, item }) =>
					item.isParent && path.split("/").filter(n => n.length > 0).length - 1 == 1
						? ({
							processed: false,
							pathToSet: REMOTES,
							latestPath: path
						})
						: item.isParent
						? ({
							processed: false,
							pathToSet: path.getParentPath(),
							latestPath: path.extractSubPath()
						})
						: item.isDirectory
						? ({
							processed: false,
							pathToSet: path.appendPath(item.name)
						})
						: { processed: true },
				sort,
				itemsSelectable: true,
				appendPath: (path: string, subPath: string) => path.appendPath(subPath),
				rename: async () => "",
				extendedRename: async () => { throw new RequestError(IOError.NotSupported, "") }, 
				renameAsCopy: async () => {},
				createFolder,
				deleteItems,
				onSelectionChanged: () => { },
				cleanUp: () => { }
			}
		})
}
