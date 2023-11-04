import { TableColumns } from "virtual-table-react"
import { FolderViewItem, ServiceStatus } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import { Controller, ControllerResult, ControllerType, addParent, sortItems } from "./controller"
import { ROOT } from "./root"
import { GetServicesResult, request } from "../requests/requests"

export const SERVICES = "services"

const renderRow = (item: FolderViewItem) => [
	(<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : IconNameType.Service}
        iconPath={item.name.getExtension()} />),
    item.status == ServiceStatus.running
        ? "An"
        : item.status == ServiceStatus.starting
        ? "Started..."
        : item.status == ServiceStatus.stopping 
        ? "Fährt runter..."
        : item.status == ServiceStatus.stopped
        ? "Aus"
        : "",
        "",
        item.description
]

const getColumns = () => ({
	columns: [
        { name: "Name", isSortable: true },
        { name: "Status", isSortable: true },
        { name: "Starttyp", isSortable: true },
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

const getSortFunction = (index: number, descending: boolean) => {
    const ascDesc = (sortResult: number) => descending ? -sortResult : sortResult
    const sf = index == 0
        ? (a: FolderViewItem, b: FolderViewItem) => a.name.localeCompare(b.name) 
        : index == 1
        ? (a: FolderViewItem, b: FolderViewItem) => (a.status || 0) - (b.status || 0)
        : index == 3
        ? (a: FolderViewItem, b: FolderViewItem) => a.description?.localeCompare(b.description || "") ?? 0 
        : undefined
    
    return sf
        ? (a: FolderViewItem, b: FolderViewItem) => ascDesc(sf(a, b))
        : undefined
}
    
