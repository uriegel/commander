import { TableColumns } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import { Controller, ControllerResult, ControllerType, ItemsType, OnEnterResult, addParent, formatDateTime, formatSize, getItemsType, sortItems } from "./controller"
import { getSortFunction } from "./filesystem"
import { REMOTES } from "./remotes"
import { IconNameType } from "../enums"
import { AsyncResult, Err, ErrorType, Nothing, Ok, jsonPost, nothing } from "functional-extensions"
import { GetExtendedItemsResult, GetItemsResult, IOError } from "../requests/requests"
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

const deleteItems = (path: string, items: FolderViewItem[], dialog: DialogHandle) => {

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

	return dialog.showDialog<Nothing, ErrorType>({
				text,
				btnOk: true,
				btnCancel: true,
				defBtnOk: true
			}, res => res.result == ResultType.Ok
			? new Ok(nothing)
			: new Err({ status: IOError.Canceled, statusText: "" }))
			.bindAsync(() => jsonPost<Nothing, ErrorType>({ method: "deleteitemsremote", payload: { path, names: items.map(n => n.name) } }))
}

const createFolder = (path: string, item: FolderViewItem, dialog: DialogHandle) => 
	dialog.showDialog<string, ErrorType>({
		text: "Neuen Ordner anlegen",
		inputText: !item.isParent ? item.name : "",
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	}, res => res.result == ResultType.Ok && res.input
	? new Ok(res.input)
	: new Err({ status: IOError.Canceled, statusText: "" }))
		.bindAsync(name => jsonPost<Nothing, ErrorType>({ method: "createdirectoryremote", payload: { path: path.appendPath(name) } })
							.map(() => name))
	
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
					jsonPost<GetItemsResult, ErrorType>({ method: "getremotefiles", payload: { id, path, showHiddenItems } })
						.map(ok => {
							currentPath = ok.path
							return { ...ok, items: addParent(sortItems(ok.items, getSortFunction(sortIndex, sortDescending))) }
						}),
				updateItems: () => null,
				getPath: () => currentPath,
				getExtendedItems: () => AsyncResult.from(new Err<GetExtendedItemsResult, ErrorType>({ status: IOError.Canceled, statusText: "" })),
				setExtendedItems: items => items,
				cancelExtendedItems: () => { },
				onEnter: ({ path, item }) =>
					AsyncResult.from(new Ok<OnEnterResult, ErrorType>(
						item.isParent && path.split("/").filter(n => n.length > 0).sideEffectForEach(n => console.log("Eintrag", n)).length - 1 == 1
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
									: { processed: true })),
				sort,
				itemsSelectable: true,
				appendPath: (path: string, subPath: string) => path.appendPath(subPath),
				rename: () => AsyncResult.from(new Ok<string, ErrorType>("")),
				extendedRename: () => AsyncResult.from(new Err<Controller, Nothing>(nothing)),
				renameAsCopy: () => AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)),
				createFolder,
				deleteItems,
				onSelectionChanged: () => { },
				cleanUp: () => { }
			}
		})
}
