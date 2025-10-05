import { TableColumns } from "virtual-table-react";
import { Item, ItemsResult } from "../items-provider/items"

export abstract class IItemsProvider {
    abstract readonly id: string
    abstract readonly itemsSelectable: boolean

    abstract getColumns(): TableColumns<Item>
    abstract getItems(id: string, path?: string, showHidden?: boolean, mount?: boolean): Promise<ItemsResult>
    onSelectionChanged(items: Item[]) {}
}

