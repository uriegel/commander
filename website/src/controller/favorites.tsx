import { DialogHandle, ResultType } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import IconName from "../components/IconName"
import { Controller, ControllerResult, ControllerType, EnterData, OnEnterResult, addParent } from "./controller"
import { ROOT } from "./root"
import { IconNameType } from "../enums"
import { AsyncResult, Err, ErrorType, Nothing, Ok, nothing } from "functional-extensions"
import { IOError, RequestError } from "../requests/requests"

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

const showAddFavorite = async (dialog: DialogHandle, otherPath?: string) => {
    const items = getFavoriteItems()
    const result =
        !items.find(n => n.name == otherPath) && (await dialog.show({
            text: `'${otherPath}' als Favoriten hinzufügen?`,
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        }))?.result == ResultType.Ok
    if (result && otherPath) {
        const newItems = items.concat([{ name: otherPath }])
        localStorage.setItem("fav", JSON.stringify(newItems))
        return true
    }
    else
        return false
}

const onNew = (dialog: DialogHandle, refresh?: ()=>void, otherPath?: string) => {
    const show = async () => {
        if (refresh && await showAddFavorite(dialog, otherPath))
            refresh()
    }
    show()
        
    return {
        processed: true
    } 
}

const onEnter = (enterData: EnterData) =>
    AsyncResult.from(new Ok<OnEnterResult, ErrorType>(
        enterData.item.isNew
        ? onNew(enterData.dialog, enterData.refresh, enterData.otherPath)
        : {
            processed: false,
            pathToSet: enterData.item.isParent ? ROOT : enterData.item.name
        })) 

export const getFavoritesController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Favorites
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Favorites, 
        id: FAVORITES,
        getColumns,
        getItems,
        updateItems: () => null,
        getPath: () => FAVORITES,
        getExtendedItems: () => { throw new RequestError(IOError.Dropped, "") },
        setExtendedItems: items => items,
        cancelExtendedItems: async () => { },
        onEnter,
        sort: (items: FolderViewItem[]) => items,
        itemsSelectable: false,
        appendPath: (_: string, subPath: string) => subPath,
        rename: () => AsyncResult.from(new Ok<string, ErrorType>("")),
        extendedRename: () => AsyncResult.from(new Err<Controller, Nothing>(nothing)),
        renameAsCopy: () => AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)),
        createFolder: () => AsyncResult.from(new Ok<string, ErrorType>("")),
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
        items: addParent(items)
            .concat({
                name: "Favoriten hinzufügen...",
                isNew: true
            })
    }
}

const deleteItems = (_: string, items: FolderViewItem[], dialog: DialogHandle) => 
    dialog.showDialog<Nothing, ErrorType>({
		text: `Möchtest Du ${items.length > 1 ? "die Favoriten" : "den Favoriten"} löschen?`,
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
    }, res => {
        if (res.result == ResultType.Ok) {
            const favs = getFavoriteItems().filter(x => !items.find(n => n.name == x.name))
            localStorage.setItem("fav", JSON.stringify(favs))
        }
        return new Ok<Nothing, ErrorType>(nothing)
    })


