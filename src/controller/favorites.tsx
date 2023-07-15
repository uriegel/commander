import { DialogHandle, Result } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import { Controller, ControllerResult, ControllerType, EnterData, addParent } from "./controller"
import { ROOT } from "./root"

export const FAVORITES = "fav"

const renderRow = (item: FolderViewItem) => [
	(<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isDirectory
        ? IconNameType.Folder
        : IconNameType.Folder}
        iconPath={item.name.getExtension()}
    />),
    item.path ?? ""
]

const getColumns = () => ({
	columns: [
		{ name: "Name" },
        { name: "Pfad" },
    ],
    getRowClasses: () => [],
	renderRow
})

const showAddFavorite = async (dialog?: DialogHandle|null, otherPath?: string) => {

    const result = await dialog?.show({
        text: `'${otherPath}' als Favoriten hinzufügen?`,
        btnOk: true,
        btnCancel: true,
        defBtnOk: true
    })
    if (result?.result == Result.Ok) {
        // items = items.concat([{ name, ipAddress, isAndroid }])
        // localStorage.setItem("remotes", JSON.stringify(items))
        return true
    }
    else
        return false
}


const onNew = (dialog?: DialogHandle|null, refresh?: ()=>void, otherPath?: string) => {
    const show = async () => {
        if (refresh && await showAddFavorite(dialog, otherPath))
            refresh()
    }
    show()
        
    return {
        processed: true
    } 
}

const onEnter = async (enterData: EnterData) =>
    enterData.item.isNew
        ? onNew(enterData.dialog, enterData.refresh, enterData.otherPath)
        : {
            processed: false,
            pathToSet: enterData.item.isParent ? ROOT : enterData.item.name
        } 

export const getFavoritesController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Favorites
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Favorites, 
        id: FAVORITES,
        getColumns,
        getItems,
        getExtendedItems: async () => ({ path: "", exifTimes: [], versions: [] }),
        setExtendedItems: items=>items,
        onEnter,
        sort: (items: FolderViewItem[]) => items,
        itemsSelectable: false,
        appendPath: (path: string, subPath: string) => subPath,
        rename: async () => null,
        extendedRename: async () => null,
        createFolder: async () => null,
        deleteItems: async () => null,
        onSelectionChanged: () => {}
    }})

const getItems = async () => {
    const items = [{
            name: "/home/uwe",
            description: "Zuhause"
        }, {
            name: "/home/uwe/videos",
            description: "Filme"
    }]
    return {
        path: FAVORITES,
        dirCount: items.length,
        fileCount: 0,
        items: addParent(items)
                .concat({
                    name: "Favoriten hinzufügen...",
                    isNew: true
                })
    }
}

