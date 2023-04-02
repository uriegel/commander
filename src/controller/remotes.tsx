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

const getRemoteItems = () => {
    var itemsStr = localStorage.getItem(REMOTES)
    return itemsStr ? JSON.parse(itemsStr) as FolderViewItem[] : []
}

const getColumns = () => ({
	columns: [
		{ name: "Name" },
        { name: "IP-Adresse" }
    ],
	renderRow
})

const getItems = async () => {
    var items = getRemoteItems()
                    .sort((a, b) => a.name.localeCompare(b.name))
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

const showNew = (dialog: DialogHandle|null, refresh?: ()=>void) => {

    var name = ""
    var ipAddress: string | undefined
    var isAndroid = false
    const showNewDialog = async () => {
        const result = await dialog?.show({
            text: "Entferntes Gerät hinzufügen",   
            extension: NewRemote,
            onExtensionChanged: (e: FolderViewItem) => {
                name = e.name
                ipAddress = e.ipAddress 
                isAndroid = e.isAndroid ?? false
            },
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        if (result?.result == Result.Ok) {
            var itemsStr = localStorage.getItem(REMOTES)
            var items = itemsStr ? JSON.parse(itemsStr) : []
            items = items.concat([{ name, ipAddress, isAndroid }])
            localStorage.setItem("remotes", JSON.stringify(items))
            if (refresh)
                refresh()
        }
    }
    showNewDialog()

    return {
        processed: true, 
        pathToSet: ROOT,
    } 
}

const onEnter = (_: string, item: FolderViewItem, keys: SpecialKeys, dialog: DialogHandle|null, refresh?: ()=>void) => 
    item.isNew
        ? showNew(dialog, refresh)
        : {
            processed: false, 
            pathToSet: ROOT
        } 

const deleteItems = async (_: string, items: FolderViewItem[], dialog: DialogHandle | null) => {
    const remotes = getRemoteItems().filter(x => !items.find(n => n.name == x.name))
    localStorage.setItem("remotes", JSON.stringify(remotes))
    return null
}

const rename = async (path: string, item: FolderViewItem, dialog: DialogHandle | null) => {
    return null
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
        itemsSelectable: true,
        appendPath: (path: string, subPath: string) => subPath,
        rename,
        createFolder: async () => null,
        deleteItems,
    }})

