import { SpecialKeys } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import { getPlatform, Platform } from "../globals"
import { Controller, ControllerResult, ControllerType, formatSize, makeTableViewItems, measureRow} from "./controller"
import { GetRootResult, request } from "./requests"

export const ROOT = "root"
const platform = getPlatform()

const renderWindowsRow = (item: FolderViewItem) => [
        (<IconName namePart={item.name} type={IconNameType.Root } />),
        item.description ?? "",
        formatSize(item.size)
    ]


const renderLinuxRow = (item: FolderViewItem) => [
        (<IconName namePart={item.name} type={IconNameType.Root } />),
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
	renderRow: renderWindowsRow,
	measureRow
})

const getLinuxColumns = () => ({
	columns: [
		{ name: "Name" },
        { name: "Bezeichnung" },
        { name: "Mountpoint" },
		{ name: "Größe", isRightAligned: true }
    ],
    getRowClasses,
	renderRow: renderLinuxRow,
	measureRow
})

const onWindowsEnter = (_: string, item: FolderViewItem, keys: SpecialKeys) => 
({
    processed: false, 
    pathToSet: item.name
}) 

const onLinuxEnter = (_: string, item: FolderViewItem, keys: SpecialKeys) => 
({
    processed: false, 
    pathToSet: item.mountPoint ?? ""
}) 

const getColumns = platform == Platform.Windows ? getWindowsColumns : getLinuxColumns
const onEnter = platform == Platform.Windows ? onWindowsEnter : onLinuxEnter

export const getRootController = (controller: Controller|null): ControllerResult => 
    controller?.type == ControllerType.Root
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Root, 
        getColumns,
        getItems,
        getExtendedItems: async () => ({ path: "", extendedItems: [] }),
        setExtendedItems: items=>items,
        onEnter,
        sort: (items: FolderViewItem[])=>items
    }})

const getItems = async () => {
	const result = await request<GetRootResult>("getroot")
    return {
        path: ROOT,
        items: makeTableViewItems(result, undefined, false)
    }
}

const getRowClasses = (item: FolderViewItem) => 
    item.isMounted == false
        ? ["notMounted"]
        : []

