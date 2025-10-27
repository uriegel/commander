import { TableColumns } from "virtual-table-react"
import { EnterData, IItemsProvider, OnEnterResult } from "./base-provider"
import { FavoriteItem, IconNameType, Item } from "./items"
import IconName from "../components/IconName"
import { DialogHandle, ResultType } from "web-dialog-react"

export const FAVORITES = "FAVORITES"

export class FavoritesProvider extends IItemsProvider {
    getId() { return FAVORITES }
    readonly itemsSelectable = true

    getColumns(): TableColumns<Item> {
        return {
            columns: [
                { name: "Name" },
                { name: "Pfad" }
            ],
            getRowClasses: () => [],
            renderRow
        }
    }

    async getItems(_: string, requestId: number) { 
        const items = [super.getParent(), ...getFavoriteItems(), {
                name: "Favoriten hinzufügen...",
                isNew: true
            }]
        return {
            requestId,
            items,
            path: "fav",
            dirCount: items.length,
            fileCount: 0
        }
    }

    async onEnter(enterData: EnterData): Promise<OnEnterResult> {
        const favEnter = enterData.item as FavoriteItem
        return favEnter.isParent
            ? {
                processed: false,
                pathToSet: "root"
            }
            : favEnter.isNew && enterData.dialog && enterData.otherPath && await this.createFavorite(enterData.dialog, enterData.otherPath)
            ? {
                processed: true,
                refresh: true
            }
            : {
                processed: false,
                pathToSet: favEnter.name
            }
    }

    async deleteItems(_path: string, items: FavoriteItem[], dialog: DialogHandle) {
        const itemsToDelete = items.filter(n => !n.isNew && !n.isParent)
        if (itemsToDelete.length == 0)
            return true
        const res = await dialog.show({
		    text: `Möchtest Du ${itemsToDelete.length > 1 ? "die Favoriten" : "den Favoriten"} löschen?`,
    		btnOk: true,
	    	btnCancel: true,
		    defBtnOk: true
        })
        if (res.result != ResultType.Ok)
            return false
        
        const favs = getFavoriteItems().filter(x => !items.find(n => n.name == x.name))
        localStorage.setItem(FAVORITES, JSON.stringify(favs))
        return true
    }    

    appendPath(_: string, subPath: string) {
        return subPath
    } 

    async createFavorite(dialog: DialogHandle, otherPath: string) {
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
            localStorage.setItem(FAVORITES, JSON.stringify(newItems))
            return true
        }
        else
            return false
    }
}

const renderRow = (item: FavoriteItem) => [
    (<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isNew
        ? IconNameType.New
        : IconNameType.Favorite}
        iconPath={item.name.getFileExtension()}
    />),
    item.path ?? ""
]

const getFavoriteItems = () => {
    const itemsStr = localStorage.getItem(FAVORITES)
    return itemsStr ? JSON.parse(itemsStr) as FavoriteItem[] : []
}
