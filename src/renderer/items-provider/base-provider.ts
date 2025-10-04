import { TableColumns } from "virtual-table-react";
import { Item } from "../items-provider/items"

export abstract class IItemsProvider {
    abstract readonly id: string

    abstract getColumns(): TableColumns<Item>
    abstract getItems(id: string, path?: string, showHidden?: boolean, mount?: boolean): Promise<Item[]>
}

