import { TableColumns } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import { Controller, ControllerResult, ControllerType, addParent, sortItems } from "./controller"
import { getSortFunction } from "./filesystem"
import { ROOT } from "./root"
import { GetItemResult, GetServicesResult, request } from "../requests/requests"

export const SERVICES = "services"

const renderRow = (item: FolderViewItem) => [
	(<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isDirectory
        ? IconNameType.Folder
        : IconNameType.File}
        iconPath={item.name.getExtension()} />)
]

const getColumns = () => ({
	columns: [
        { name: "Name", isSortable: true },
        { name: "Status", isSortable: true },
        { name: "Starttyp", isSortable: true },
        { name: "Anmelden als", isSortable: true },
        { name: "Beschreibung", isSortable: true }
	],
	renderRow
} as TableColumns<FolderViewItem>)

const getItems = async (path: string, showHidden: boolean, sortIndex: number, sortDescending: boolean) => {
    const services =
        addParent(sort(await request<GetServicesResult>("getservices"), sortIndex, sortDescending))
    return {
        path: SERVICES,
        dirCount: services.length,
        fileCount: 0,
        items: services 
    }
}

const sort = (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => 
	sortItems(items, getSortFunction(sortIndex, sortDescending), true) 

export const getServicesController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Services
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Services, 
        id: SERVICES,
        getColumns,
        getItems,
        getExtendedItems: async () => ({ path: "", exifTimes: [], versions: [] }),
		setExtendedItems: items => items,
		cancelExtendedItems: async () => { },
		onEnter: async ({path, item}) => 
			item.isParent
			?  ({
				processed: false, 
				pathToSet: ROOT,
				latestPath: path
			}) 
			: { processed: true },
        sort,
        itemsSelectable: true,
        appendPath: (path: string, subPath: string) => path.appendPath(subPath),
		rename: async () => null,
		extendedRename: async () => null,
		renameAsCopy: async () => null,
        createFolder: async () => null,
        deleteItems: async () => null,
		onSelectionChanged: () => {}
    }})


