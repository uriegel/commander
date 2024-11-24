import { DialogHandle, ResultType } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import RemoteDialog from "../components/dialogparts/RemoteDialog"
import { Controller, ControllerResult, ControllerType, EnterData, addParent } from "./controller"
import { ROOT } from "./root"
import { IconNameType } from "../enums"
import { IOError, RequestError } from "../requests/requests"

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

const showRemote = async(dialog: DialogHandle, item?: FolderViewItem) => {
    let name = item?.name
    let ipAddress = item?.ipAddress
    let isAndroid = item?.isAndroid ?? true
    let items = getRemoteItems().filter(n => n.name != item?.name)
    const res = await dialog.show({
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
    if (name && res.result == ResultType.Ok) {
        items = items.concat([{ name, ipAddress, isAndroid }])
        localStorage.setItem("remotes", JSON.stringify(items))
        return name
    } else
        throw new RequestError(IOError.NotSupported, "")
}

const startShowRemote = async (dialog: DialogHandle, refresh?: ()=>void) => {

    await showRemote(dialog)
    refresh?.()
           
    return {
        processed: true, 
        pathToSet: ROOT
    } 
}

const onEnter = async (enterData: EnterData) => 
    enterData.item.isNew
        ? await startShowRemote(enterData.dialog, enterData.refresh)
        : {
            processed: false, 
            pathToSet: enterData.item.isParent ? ROOT : `remote/${enterData.item.ipAddress}`
        } 

const deleteItems = async (_: string, items: FolderViewItem[], dialog: DialogHandle) => {
    const res = await dialog.show({
        text: `Möchtest Du ${items.length > 1 ? "die Einträge" : "den Eintrag"} löschen?`,
        btnOk: true,
        btnCancel: true,
        defBtnOk: true
    })

    if (res.result == ResultType.Ok) {
        const remotes = getRemoteItems().filter(x => !items.find(n => n.name == x.name))
        localStorage.setItem("remotes", JSON.stringify(remotes))
    }
}

const rename = (_: string, item: FolderViewItem, dialog: DialogHandle) => 
    showRemote(dialog, item)

export const getRemotesController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Remotes
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Remotes, 
        id: REMOTES,
        getColumns,
        getItems,
        updateItems: ()=>null,
        getPath: () => REMOTES,
        getExtendedItems: () => { throw new RequestError(IOError.Dropped, "") },
        setExtendedItems: items => items,
        cancelExtendedItems: async () => { },
        onEnter,
        sort: (items: FolderViewItem[]) => items,
        itemsSelectable: true,
        appendPath: (_: string, subPath: string) => subPath,
        rename,
        extendedRename: async () => { throw new RequestError(IOError.NotSupported, "") }, 
        renameAsCopy: async () => {},
        createFolder: async () => "",
        deleteItems,
        onSelectionChanged: () => { },
        cleanUp: () => { }
    }})

