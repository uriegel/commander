import { DialogHandle, Result } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import { Controller, ControllerResult, ControllerType, EnterData, addParent } from "./controller"
import { ROOT } from "./root"
import { IOError } from "../requests/requests"
import { IconNameType } from "../enums"

export const FAVORITES = "fav"

const renderRow = (item: FolderViewItem) => [
	(<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isNew
        ? IconNameType.New
        : IconNameType.Favorite}
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

const getFavoriteItems = () => {
    const itemsStr = localStorage.getItem("fav")
    return itemsStr ? JSON.parse(itemsStr) as FolderViewItem[] : []
}

const showAddFavorite = async (dialog?: DialogHandle | null, otherPath?: string) => {
    const items = getFavoriteItems()
    const result =
        !items.find(n => n.name == otherPath) && (await dialog?.show({
            text: `'${otherPath}' als Favoriten hinzufügen?`,
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        }))?.result == Result.Ok
    if (result && otherPath) {
        const newItems = items.concat([{ name: otherPath }])
        localStorage.setItem("fav", JSON.stringify(newItems))
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

export const getFavoritesController = async (controller: Controller | null): Promise<ControllerResult> => 
    controller?.type == ControllerType.Favorites
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Favorites, 
        id: FAVORITES,
        getColumns,
        getItems,
        getExtendedItems: async () => ({ path: "", exifTimes: [], versions: [] }),
        setExtendedItems: items => items,
        cancelExtendedItems: async () => { },
        onEnter,
        sort: (items: FolderViewItem[]) => items,
        itemsSelectable: false,
        appendPath: (_: string, subPath: string) => subPath,
        rename: async () => null,
        extendedRename: async () => null,
        renameAsCopy: async () => null,
        createFolder: async () => null,
        deleteItems,
        onSelectionChanged: () => { },
        cleanUp: () => { }
    }})

const getItems = async () => {
    const items = getFavoriteItems()
    return {
        path: FAVORITES,
        dirCount: items.length,
        fileCount: 0,
        error: IOError.NoError,
        items: addParent(items)
                .concat({
                    name: "Favoriten hinzufügen...",
                    isNew: true
                })
    }
}

const deleteItems = async (_: string, items: FolderViewItem[], dialog: DialogHandle | null) => {
	const result = await dialog?.show({
		text: `Möchtest Du ${items.length > 1 ? "die Favoriten" : "den Favoriten"} löschen?`,
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
    if (result?.result == Result.Ok) {
        const favs = getFavoriteItems().filter(x => !items.find(n => n.name == x.name))
        localStorage.setItem("fav", JSON.stringify(favs))
    }
    return null
}

