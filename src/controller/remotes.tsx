import { SpecialKeys } from "virtual-table-react"
import { DialogHandle, Result } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import NewRemote from "../components/NewRemote"
import { addParent, Controller, ControllerResult, ControllerType } from "./controller"
import { ROOT } from "./root"

export const REMOTES = "remotes"

const renderRow = (item: FolderViewItem) => [
    (<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isAndroid
        ? IconNameType.Android
        : item.isNew      
        ? IconNameType.New
        : IconNameType.Remote
    } />),
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
    var itemsStr = localStorage.getItem(REMOTES)
    var items = itemsStr ? JSON.parse(itemsStr) : []

    return {
        path: REMOTES,
        dirCount: items.length,
        fileCount: 0,
        items: addParent(items)
                .concat({
                    name: "Entferntes Gerät hinzufügen...",
                    isNew: true
                })
    }
}

export interface RemotesItem {
    name:       string
    ip?:        string
    isAndroid?: boolean
    isNew?:     boolean
}

const showNew = (dialog: DialogHandle|null) => {

    var name = ""
    var ip: string | undefined
    var isAndroid = false
    const showNewDialog = async () => {
        const result = await dialog?.show({
            text: "Entferntes Gerät hinzufügen",   
            extension: NewRemote,
            onExtensionChanged: (e: RemotesItem) => {
                name = e.name
                ip = e.ip 
                isAndroid = e.isAndroid ?? false
            },
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        if (result?.result == Result.Ok) {
            console.log("new remote", name, ip, isAndroid)
        }

    }
    showNewDialog()

    return {
        processed: true, 
        pathToSet: ROOT
    } 
}

const onEnter = (_: string, item: FolderViewItem, keys: SpecialKeys, dialog: DialogHandle|null) => 
    item.isNew
        ? showNew(dialog)
        : {
            processed: false, 
            pathToSet: ROOT
        } 

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
        rename: async () => null,
        createFolder: async () => null,
        deleteItems: async () => null,
    }})

