import { DialogHandle, ResultType } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import RemoteDialog from "../components/dialogparts/RemoteDialog"
import { addParent, Controller, ControllerResult, ControllerType, EnterData } from "./controller"
import { ROOT } from "./root"
import { IOError } from "../requests/requests"
import { IconNameType } from "../enums"

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
    const itemsStr = localStorage.getItem(REMOTES)
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
    const items = getRemoteItems()
                    .sort((a, b) => a.name.localeCompare(b.name))
    return {
        path: REMOTES,
        dirCount: items.length,
        fileCount: 0,
        error: IOError.NoError,
        items: addParent(items)
                .concat({
                    name: "Entferntes Gerät hinzufügen...",
                    isNew: true
                })
    }
}

const showRemote = async (dialog?: DialogHandle|null, item?: FolderViewItem) => {

    let name = item?.name
    let ipAddress = item?.ipAddress
    let isAndroid = item?.isAndroid ?? true
    let items = getRemoteItems().filter(n => n.name != item?.name)
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
    if (name && result?.result == ResultType.Ok) {
        items = items.concat([{ name, ipAddress, isAndroid }])
        localStorage.setItem("remotes", JSON.stringify(items))
        return true
    }
    else
        return false
}

const startShowRemote = (dialog?: DialogHandle|null, refresh?: ()=>void) => {

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

const onEnter = async (enterData: EnterData) => 
    enterData.item.isNew
        ? startShowRemote(enterData.dialog, enterData.refresh)
        : {
            processed: false, 
            pathToSet: enterData.item.isParent ? ROOT : `remote/${enterData.item.ipAddress}/`
        } 

const deleteItems = async (_: string, items: FolderViewItem[], dialog: DialogHandle | null) => {
	const result = await dialog?.show({
		text: `Möchtest Du ${items.length > 1 ? "die Einträge" : "den Eintrag"} löschen?`,
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
    if (result?.result == ResultType.Ok) {
        const remotes = getRemoteItems().filter(x => !items.find(n => n.name == x.name))
        localStorage.setItem("remotes", JSON.stringify(remotes))
    }
    return null
}

const rename = async (_: string, item: FolderViewItem, dialog: DialogHandle | null) => {
    await showRemote(dialog, item)
    return null
}

export const getRemotesController = async (controller: Controller | null): Promise<ControllerResult> => 
    controller?.type == ControllerType.Remotes
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Remotes, 
        id: REMOTES,
        getColumns,
        getItems,
        getExtendedItems: async () => ({ path: "", exifTimes: [], versions: [] }),
        setExtendedItems: items => items,
        cancelExtendedItems: async () => { },
        onEnter,
        sort: (items: FolderViewItem[]) => items,
        itemsSelectable: true,
        appendPath: (_: string, subPath: string) => subPath,
        rename,
        extendedRename: async () => null,
        renameAsCopy: async()=>null,
        createFolder: async () => null,
        deleteItems,
        onSelectionChanged: () => { },
        cleanUp: () => { }
    }})

