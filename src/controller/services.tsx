import { TableColumns } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import { Controller, ControllerResult, ControllerType, sortItems } from "./controller"
import { ROOT } from "./root"
import { GetItemsResult, IOError, IOErrorResult, request } from "../requests/requests"
import { DialogHandle } from "web-dialog-react"
import { IconNameType, ServiceStartMode, ServiceStatus } from "../enums"
import { AsyncResult, Err, ErrorType, Nothing, Ok, nothing } from "functional-extensions"

export const SERVICES = "services"

const renderRow = (item: FolderViewItem) => [
	(<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : IconNameType.Service}
        iconPath={item.name.getExtension()} />),
        item.status == ServiceStatus.Running
        ? "An"
        : item.status == ServiceStatus.Starting
        ? "Started..."
        : item.status == ServiceStatus.Stopping 
        ? "Fährt runter..."
        : item.status == ServiceStatus.Stopped
        ? "Aus"
        : "",
        item.startType == ServiceStartMode.Boot
        ? "Boot"
        : item.startType == ServiceStartMode.System
        ? "System"
        : item.startType == ServiceStartMode.Automatic
        ? "Automatisch"
        : item.startType == ServiceStartMode.Manual
        ? "Manuell"
        : item.startType == ServiceStartMode.Disabled
        ? "Deaktiviert"
        : "",
        item.description
]

const getColumns = () => ({
	columns: [
        { name: "Name", isSortable: true },
        { name: "Status", isSortable: true },
        { name: "Starttyp", isSortable: true },
        { name: "Beschreibung", isSortable: true }
	],
    renderRow,
    getRowClasses
} as TableColumns<FolderViewItem>)

const getItems = () => AsyncResult.from(new Err<GetItemsResult, ErrorType>({status: IOError.Canceled, statusText: ""}))
// TODO
// const getItems = async (_: string, __: boolean, sortIndex: number, sortDescending: boolean) => {
//     const services =
//         addParent(sort(await request<GetServicesResult>("getservices"), sortIndex, sortDescending))
//     return {
//         path: SERVICES,
//         dirCount: services.length,
//         fileCount: 0,
//         error: IOError.NoError,
//         items: services 
//     }
// }

const sort = (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => 
	sortItems(items, getSortFunction(sortIndex, sortDescending), true) 

export const getServicesController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Services
    ? ({ changed: false, controller })
    : createController()

const createController = (): ControllerResult => {
    // TODO move to getServices
    //await request<IOErrorResult>("initservices")    

    return {
        changed: true, controller: { 
            type: ControllerType.Services, 
            id: SERVICES,
            getColumns,
            getItems,
            getPath: () => SERVICES,
            getExtendedItems: async () => ({ path: "", exifTimes: [], versions: [] }),
            setExtendedItems: items => items,
            cancelExtendedItems: async () => { },
            onEnter: async ({ path, item, selectedItems, dialog }) => {
                if (item.isParent)
                    return ({
                        processed: false,
                        pathToSet: ROOT,
                        latestPath: path
                    })
                else {
                    start(selectedItems || [item ], dialog)
                    return { processed: true }
                }
                    
            },
            sort,
            itemsSelectable: true,
            appendPath: (path: string, subPath: string) => path.appendPath(subPath),
            rename: () => AsyncResult.from(new Ok<string, ErrorType>("")),
            extendedRename: async () => null,
            renameAsCopy: async () => null,
            createFolder: () => AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)),
            // TODOdeleteItems: async (_, items, dialog) => await stop(items, dialog),
            deleteItems: () => AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)),
            onSelectionChanged: () => { },
            cleanUp: () => request("cleanupservices")
        }
    }
}

const getSortFunction = (index: number, descending: boolean) => {
    const ascDesc = (sortResult: number) => descending ? -sortResult : sortResult
    const sf = index == 0
        ? (a: FolderViewItem, b: FolderViewItem) => a.name.localeCompare(b.name) 
        : index == 1
        ? (a: FolderViewItem, b: FolderViewItem) => (a.status || 0) - (b.status || 0)
        : index == 2
        ? (a: FolderViewItem, b: FolderViewItem) => (a.startType || 0) - (b.startType || 0)
        : index == 3
        ? (a: FolderViewItem, b: FolderViewItem) => a.description?.localeCompare(b.description || "") ?? 0 
        : undefined
    
    return sf
        ? (a: FolderViewItem, b: FolderViewItem) => ascDesc(sf(a, b))
        : undefined
}
    
const getRowClasses = (item: FolderViewItem) => 
    item.startType == ServiceStartMode.Disabled
    ? ["disabled"]
    : item.status != ServiceStatus.Running
    ? ["notRunning"]
    : []

const start = async (selectedItems: FolderViewItem[], dialog?: DialogHandle|null) => {
    request<IOErrorResult>("startservices", {
        items: selectedItems
            .filter(n => n.status == ServiceStatus.Stopped)
            .map(n => n.name)
    }, dialog)
}

// const stop = async (selectedItems: FolderViewItem[], dialog?: DialogHandle|null) => {
//     request<IOErrorResult>("stopservices", {
//         items: selectedItems
//                     .filter(n => n.status == ServiceStatus.Running)
//                     .map(n => n.name)
//     }, dialog)
//     return IOError.NoError
// }