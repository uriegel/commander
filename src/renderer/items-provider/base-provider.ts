import { TableColumns } from "virtual-table-react";
import { Item, ItemsResult } from "../items-provider/items"
import { DialogHandle } from "web-dialog-react";

export interface EnterData {
    id?: string
    path: string,
    item: Item, 
    selectedItems?: Item[]
    dialog?: DialogHandle
    otherPath?: string
}

export interface OnEnterResult {
    processed: boolean
    pathToSet?: string
    latestPath?: string
    mount?: boolean
    refresh?: boolean
}

export abstract class IItemsProvider {
    abstract readonly id: string
    abstract readonly itemsSelectable: boolean

    abstract getColumns(): TableColumns<Item>
    abstract getItems(id: string, path?: string, showHidden?: boolean, mount?: boolean): Promise<ItemsResult>
    abstract onEnter(data: EnterData): Promise<OnEnterResult> 
    onSelectionChanged(items: Item[]) {}
}

