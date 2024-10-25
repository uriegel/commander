import { DialogHandle, ResultType } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import RemoteDialog from "../components/dialogparts/RemoteDialog"
import { Controller, ControllerResult, ControllerType, EnterData, OnEnterResult, addParent } from "./controller"
import { ROOT } from "./root"
import { IconNameType } from "../enums"
import { AsyncResult, Err, ErrorType, Nothing, Ok, nothing } from "functional-extensions"
import { GetExtendedItemsResult, GetItemsResult, IOError } from "../requests/requests"

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

const getItems = () => {
    const items = getRemoteItems()
    return AsyncResult
        .from(new Ok<GetItemsResult, ErrorType>({
            path: REMOTES,
            dirCount: items.length,
            fileCount: 0,
            items: addParent(items)
                .concat({
                    name: "Entferntes Gerät hinzufügen...",
                    isNew: true
                })
        }
        ))
}

const showRemote = (dialog: DialogHandle, item?: FolderViewItem) => {

    let name = item?.name
    let ipAddress = item?.ipAddress
    let isAndroid = item?.isAndroid ?? true
    let items = getRemoteItems().filter(n => n.name != item?.name)
    return dialog.showDialog({
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
    }, res => {
        if (name && res.result == ResultType.Ok) {
            items = items.concat([{ name, ipAddress, isAndroid }])
            localStorage.setItem("remotes", JSON.stringify(items))
            return new Ok<string, ErrorType>(name)
        } else
            return new Err<string, ErrorType>({ status: IOError.Exn, statusText: "" })
    })
}

const startShowRemote = (dialog: DialogHandle, refresh?: ()=>void) => {

    showRemote(dialog)
        .match(
            () => refresh && refresh(),
            () => {})
    return {
        processed: true, 
        pathToSet: ROOT
    } 
}

const onEnter = (enterData: EnterData) => 
    AsyncResult.from(new Ok<OnEnterResult, ErrorType>(
        enterData.item.isNew
            ? startShowRemote(enterData.dialog, enterData.refresh)
            : {
                processed: false, 
                pathToSet: enterData.item.isParent ? ROOT : `remote/${enterData.item.ipAddress}`
            } ))

const deleteItems = (_: string, items: FolderViewItem[], dialog: DialogHandle) => 
    dialog.showDialog<Nothing, ErrorType>({
        text: `Möchtest Du ${items.length > 1 ? "die Einträge" : "den Eintrag"} löschen?`,
        btnOk: true,
        btnCancel: true,
        defBtnOk: true
    }, res => {
        if (res.result == ResultType.Ok) {
            const remotes = getRemoteItems().filter(x => !items.find(n => n.name == x.name))
            localStorage.setItem("remotes", JSON.stringify(remotes))
        }
        return new Ok<Nothing, ErrorType>(nothing)
    })

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
        getExtendedItems: () => AsyncResult.from(new Err<GetExtendedItemsResult, ErrorType>({status: IOError.Canceled, statusText: ""})),
        setExtendedItems: items => items,
        cancelExtendedItems: async () => { },
        onEnter,
        sort: (items: FolderViewItem[]) => items,
        itemsSelectable: true,
        appendPath: (_: string, subPath: string) => subPath,
        rename,
        extendedRename: () => AsyncResult.from(new Err<Controller, Nothing>(nothing)),
        renameAsCopy: () => AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)),
        createFolder: () => AsyncResult.from(new Ok<string, ErrorType>("")),
        deleteItems,
        onSelectionChanged: () => { },
        cleanUp: () => { }
    }})

