import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import { getPlatform, Platform } from "../globals"
import { Controller, ControllerResult, ControllerType, EnterData, formatSize} from "./controller"
import { REMOTES } from "./remotes"
import { webViewRequest, IOError, RequestError } from "../requests/requests"
import "functional-extensions"
import { SERVICES } from "./services"
import { FAVORITES } from "./favorites"
import { IconNameType } from "../enums"

export const ROOT = "root"
const platform = getPlatform()

interface RootItem {
    name:        string
    description: string
    size:        number
    isMounted?:  boolean
    mountPoint?: string
}

type GetRootResult = RootItem[]

const renderWindowsRow = (item: FolderViewItem) => [
    (<IconName namePart={item.name} type={
        item.name == REMOTES
        ? IconNameType.Remote
        : item.name == SERVICES
        ? IconNameType.Service
        : item.name == FAVORITES
        ? IconNameType.Favorite
        : IconNameType.Root
    } />),
    item.description ?? "",
    formatSize(item.size)
]

const renderLinuxRow = (item: FolderViewItem) => [
    (<IconName namePart={item.name} type={
        item.name == '~'
        ? IconNameType.Home
        : item.name == REMOTES
        ? IconNameType.Remote
        : item.name == FAVORITES
        ? IconNameType.Favorite
        : IconNameType.Root
    } />),
    item.description ?? "",
    item.mountPoint ?? "",
    formatSize(item.size)
]

const getWindowsColumns = () => ({
	columns: [
		{ name: "Name" },
		{ name: "Beschreibung" },
		{ name: "Größe", isRightAligned: true }
	],
    getRowClasses,
	renderRow: renderWindowsRow
})

const getLinuxColumns = () => ({
	columns: [
		{ name: "Name" },
        { name: "Bezeichnung" },
        { name: "Mountpoint" },
		{ name: "Größe", isRightAligned: true }
    ],
    getRowClasses,
	renderRow: renderLinuxRow
})

const onWindowsEnter = async (enterData: EnterData) => {
    if (enterData.keys.alt) {
        await webViewRequest("onenter", { path: enterData.item.name, keys: enterData.keys })
        return { processed: true }
    } else
        return {
            processed: false,
            pathToSet: enterData.item.name
        }
}

const onLinuxEnter = async (enterData: EnterData) => ({
        processed: false, 
        pathToSet: enterData.item.mountPoint || enterData.item.mountPoint!.length > 0 ? enterData.item.mountPoint : enterData.item.name,
        mount: !enterData.item.mountPoint
    })

export const getRootController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Root
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Root, 
        id: ROOT,
        getPath: () => ROOT,
        getColumns: platform == Platform.Windows ? getWindowsColumns : getLinuxColumns,
        getItems,
        updateItems: ()=>null,
        getExtendedItems: () => { throw new RequestError(IOError.Dropped, "") },
        setExtendedItems: items => items,
        cancelExtendedItems: async () => { },
        onEnter: platform == Platform.Windows ? onWindowsEnter : onLinuxEnter,
        sort: (items: FolderViewItem[]) => items,
        itemsSelectable: false,
        appendPath: (_: string, subPath: string) => subPath,
        rename: async () => "",
        extendedRename: async () => { throw new RequestError(IOError.NotSupported, "") }, 
        renameAsCopy: async () => {},
        createFolder: async () => "",
        deleteItems: async () => {},
        onSelectionChanged: () => { },
        cleanUp: () => { }
    }})

const getItems = () => 
    webViewRequest<GetRootResult>("getroot")
        .map(items => {
            const pos = items.findIndex(n => !n.isMounted)
            const extendedItems = items
                .insert(pos != -1 ? pos : items.length, {
                    name: "fav",
                    description: "Favoriten",
                    size: 0,
                    isMounted: true,
                    mountPoint: ""
                })
                .insert(pos != -1 ? pos + 1 : items.length + 1, {
                    name: "remotes",
                    description: "Zugriff auf entfernte Geräte",
                    size: 0,
                    isMounted: true,
                    mountPoint: ""
                })
                return {
                    path: ROOT,
                    dirCount: extendedItems.length,
                    fileCount: 0,
                    items: extendedItems
                }            
        })

const getRowClasses = (item: FolderViewItem) => 
    item.isMounted == false
        ? ["notMounted"]
        : []

