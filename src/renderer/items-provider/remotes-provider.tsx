import { Column, TableColumns } from "virtual-table-react"
import { EnterData, IItemsProvider, OnEnterResult } from "./base-provider"
import { IconNameType, Item, RemotesItem } from "./items"
import IconName from "../components/IconName"
import { DialogHandle, ResultType } from "web-dialog-react"
import Remote from "../components/dialogs/Remote"

export const Remotes = "Remotes"

export class RemotesItemProvider extends IItemsProvider {
    getId() { return Remotes }
    readonly itemsSelectable = false

    getColumns(): TableColumns<Item> {
        return {
            columns: [
                { name: "Name" },
                { name: "IP-Adresse" }
            ] as Column[],
            getRowClasses: () => [],
            renderRow
        }
    }

    async getItems(_: string, requestId: number) {
        const items = [
            super.getParent(),
            ... getItems(), {
                name: "Entferntes Gerät hinzufügen...",
                isNew: true
            } as Item
        ]
        return {
            requestId,
            path: "remotes",
            items,
            dirCount: items.length,
            fileCount: 0
        }
    }

    appendPath = (_: string, subPath: string) => subPath

    async onEnter(enterData: EnterData): Promise<OnEnterResult> {
        const remotesEnter = enterData.item as RemotesItem
        return remotesEnter.isParent
            ? {
                processed: false,
                pathToSet: "root"
            }
            : remotesEnter.isNew && enterData.dialog && enterData.otherPath && await this.showRemoteDialog(enterData.dialog) != null
            ? {
                processed: true,
                refresh: true
            }
            : {
                processed: false,
                pathToSet: remotesEnter.name
            }
    }

    async showRemoteDialog(dialog: DialogHandle, item?: RemotesItem) {
        let name = item?.name
        let ipAddress = item?.ipAddress
        let isAndroid = item?.isAndroid ?? true
        const items = getItems().filter(n => n.name != item?.name) as RemotesItem[]
        const result = await dialog.show({
            text: item ? "Entferntes Gerät ändern" : "Entferntes Gerät hinzufügen",
            extension: Remote,
            extensionProps: { name, ipAddress, isAndroid },
            onExtensionChanged: (e: RemotesItem) => {
                name = e.name
                ipAddress = e.ipAddress
                isAndroid = e.isAndroid ?? false
            },
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        if (name && result.result == ResultType.Ok) {
            const newItems = items.concat([{ name, ipAddress, isAndroid }])
            localStorage.setItem(Remotes, JSON.stringify(newItems))
            return name
        }
        return ""
    }

    async deleteItems(_path: string, items: RemotesItem[], dialog: DialogHandle) {
        const itemsToDelete = items.filter(n => !n.isNew && !n.isParent)
        if (itemsToDelete.length == 0)
            return false
        const res = await dialog.show({
		    text: `Möchtest Du ${itemsToDelete.length > 1 ? "die Geräte" : "das Gerät"} löschen?`,
    		btnOk: true,
	    	btnCancel: true,
		    defBtnOk: true
        })
        if (res.result != ResultType.Ok)
            return false
        
        const remoteItems = getItems().filter(x => !items.find(n => n.name == x.name))
        localStorage.setItem(Remotes, JSON.stringify(remoteItems))
        return true
    }

    async renameItem(_: string, item: Item, dialog: DialogHandle) {
        return await this.showRemoteDialog(dialog, item)
    }
}

const renderRow = (item: RemotesItem) => [
    (<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isNew
        ? IconNameType.New
        : item.isAndroid
        ? IconNameType.Android
        : IconNameType.Remote}
        iconPath={item.name.getFileExtension()}
    />),
    item.ipAddress ?? ""
]    

const getItems = () => {
    const itemsStr = localStorage.getItem(Remotes)
    return (itemsStr ? JSON.parse(itemsStr) as Item[] : [])
}