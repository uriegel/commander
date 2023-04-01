import { SpecialKeys } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import { Controller, ControllerResult, ControllerType } from "./controller"

export const REMOTES = "remotes"

const renderRow = (item: FolderViewItem) => [
    (<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isAndroid
        ? IconNameType.Android
        : item.isNew      
        ? IconNameType.Remote
        : IconNameType.New
    } />),
    item.name ?? "",
    item.ipAddress ?? ""
]

const getColumns = () => ({
	columns: [
		{ name: "Name" },
        { name: "IP-Adresse" }
    ],
	renderRow
})

const getItems = async () => {
	const items = [] as RemotesItem[]
    return {
        path: REMOTES,
        dirCount: items.length,
        fileCount: 0,
        items
    }
}

export interface RemotesItem {
    name:       string
    ip?:        string
    isAndroid?: boolean
    isNew?:     boolean
}

const onEnter = (_: string, item: FolderViewItem, keys: SpecialKeys) => 
({
    processed: false, 
    pathToSet: item.mountPoint ?? ""
}) 

export const getRemotesController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Remotes
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Remotes, 
        id: REMOTES,
        getColumns,
        getItems,
        getExtendedItems: async () => ({ path: "", exifTimes: [], versions: [] }),
        setExtendedItems: items=>items,
        onEnter,
        sort: (items: FolderViewItem[]) => items,
        itemsSelectable: false,
        appendPath: (path: string, subPath: string) => subPath,
        rename: async () => undefined,
        createFolder: async () => undefined,
        deleteItems: async () => undefined,
    }})

    // localStorage: remotes
// Anzeigenamen festlegen
// IP-Adresse des entfernten Gerätes
// [] Android