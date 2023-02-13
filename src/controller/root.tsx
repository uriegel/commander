import { TableRowItem } from "virtual-table-react"
import IconName, { IconNameType } from "../components/IconName"
import { getPlatform, Platform } from "../globals"
import { Controller, ControllerResult, ControllerType, formatSize, makeTableViewItems } from "./controller"
import { GetRootResult, request, RootItem } from "./requests"

export const ROOT = "root"

export const getRootController = (controller: Controller|null): ControllerResult =>
    controller?.type == ControllerType.Root
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Root, 
        getColumns: () => getPlatform() == Platform.Windows ? getWindowsColumns() : getLinuxColumns(),
        getItems 
    }})

const renderWindowsRow = (props: TableRowItem) => {
    var item = props as RootItem
    return [
        (<IconName namePart={item.name} type={IconNameType.Root } />),
        item.description,
        formatSize(item.size)
    ]
}

const getWindowsColumns = () => ({
	columns: [
		{ name: "Name", isSortable: true },
		{ name: "Beschreibung", isSortable: true },
		{ name: "Größe", isRightAligned: true, isSortable: true }
	],
	renderRow: renderWindowsRow,
	measureRow: () => (<IconName namePart="Measure g" type={IconNameType.Folder} />),
})

const getItems = async () => {
	const result = await request<GetRootResult>("getroot")
    return {
        path: ROOT,
        items: makeTableViewItems(result, false)
    }
}

const getLinuxColumns = getWindowsColumns