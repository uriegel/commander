import { TableColumns } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import { Controller, ControllerResult, ControllerType, OnEnterResult, addParent, sortItems } from "./controller"
import { ROOT } from "./root"
import { GetItemsResult, IOError, RequestError, webViewRequest, webViewRequest1 } from "../requests/requests"
import { IconNameType, ServiceStartMode, ServiceStatus } from "../enums"
import { AsyncResult, Err, ErrorType, Nothing, Ok, nothing } from "functional-extensions"

export const SERVICES = "services"

interface ServiceItem {
    name:        string
    description: string
} 

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

const getItems = (_: string, __: string, ___: boolean, sortIndex: number, sortDescending: boolean) => 
    webViewRequest<ServiceItem[]>("getservices")
        .map(items => ({
            path: SERVICES,
            dirCount: items.length,
            fileCount: 0,
            error: IOError.Unknown,
            items: addParent(sort(items, sortIndex, sortDescending))
        } as GetItemsResult))

const sort = (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => 
	sortItems(items, getSortFunction(sortIndex, sortDescending), true) 

export const getServicesController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Services
    ? ({ changed: false, controller })
    : createController()

const createController = (): ControllerResult => ({
    changed: true, controller: { 
        type: ControllerType.Services, 
        id: SERVICES,
        getColumns,
        getItems,
        updateItems: ()=>null,
        getPath: () => SERVICES,
        getExtendedItems: () => { throw new RequestError(IOError.Dropped, "") },
        setExtendedItems: items => items,
        cancelExtendedItems: async () => { },
        onEnter: ({ path, item, selectedItems }) => 
            item.isParent
                ? AsyncResult.from(new Ok<OnEnterResult, ErrorType>({
                    processed: false,
                    pathToSet: ROOT,
                    latestPath: path
                }))
                : start(selectedItems || [item ])
                    .map(() =>({ processed: true } as OnEnterResult)),
        sort,
        itemsSelectable: true,
        appendPath: (path: string, subPath: string) => path.appendPath(subPath),
        rename: () => AsyncResult.from(new Ok<string, ErrorType>("")),
        extendedRename: () => AsyncResult.from(new Err<Controller, Nothing>(nothing)),
        renameAsCopy: () => AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)),
        createFolder: () => AsyncResult.from(new Ok<string, ErrorType>("")),
        deleteItems: (_: string, selectedItems: FolderViewItem[]) => 
            selectedItems[0].isParent
                ? AsyncResult.from(new Ok<Nothing, ErrorType>(nothing))
                : stop(selectedItems),
        onSelectionChanged: () => { },
        cleanUp: () => webViewRequest1<Nothing, ErrorType>("cleanupservices")
    }
})


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

const start = (selectedItems: FolderViewItem[]) => 
    webViewRequest1<Nothing, ErrorType>("startservices", {
            items: selectedItems
                .filter(n => n.status == ServiceStatus.Stopped)
                .map(n => n.name)
        })
      
const stop = (selectedItems: FolderViewItem[]) => 
    webViewRequest1<Nothing, ErrorType>("stopservices", {
            items: selectedItems
                .filter(n => n.status == ServiceStatus.Running)
                .map(n => n.name)
        })
