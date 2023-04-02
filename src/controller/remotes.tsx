import { SpecialKeys } from "virtual-table-react"
import { DialogHandle, Result } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import RemoteDialog from "../components/RemoteDialog"
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

const showRemote = async (dialog: DialogHandle|null, item?: FolderViewItem) => {

    var name = item?.name
    var ipAddress = item?.ipAddress
    var isAndroid = item?.isAndroid ?? true
    var items = getRemoteItems().filter(n => n.name != item?.name)
    const result = await dialog?.show({
        text: "Entferntes Gerät hinzufügen",   
        extension: RemoteDialog,
        extensionProps: { name, ipAddress, isAndroid },
        onExtensionChanged: (e: FolderViewItem) => {
            name = e.name
            ipAddress = e.ipAddress 
            isAndroid = e.isAndroid ?? false
        },
        btnOk: true,
        btnCancel: true,
        defBtnOk: true
    })
    if (name && result?.result == Result.Ok) {
        items = items.concat([{ name, ipAddress, isAndroid }])
        localStorage.setItem("remotes", JSON.stringify(items))
        return true
    }
    else
        return false
}

const startShowRemote = (dialog: DialogHandle|null, refresh?: ()=>void) => {

    const show = async () => {
        if (refresh && await showRemote(dialog))
            refresh()
    }
    show()

    return {
        processed: true, 
        pathToSet: ROOT
    } 
}

const onEnter = (_: string, item: FolderViewItem, keys: SpecialKeys, dialog: DialogHandle|null, refresh?: ()=>void) => 
    item.isNew
        ? startShowRemote(dialog, refresh)
        : {
            processed: false, 
            pathToSet: item.isParent ? ROOT : `remote/${item.ipAddress}/`
        } 

const deleteItems = async (_: string, items: FolderViewItem[], dialog: DialogHandle | null) => {
	const result = await dialog?.show({
		text: `Möchtest Du ${items.length > 1 ? "die Einträge" : "den Eintrag"} löschen?`,
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
    if (result?.result == Result.Ok) {
        const remotes = getRemoteItems().filter(x => !items.find(n => n.name == x.name))
        localStorage.setItem("remotes", JSON.stringify(remotes))
    }
    return null
}

const rename = async (path: string, item: FolderViewItem, dialog: DialogHandle | null) => {
    await showRemote(dialog, item)
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

