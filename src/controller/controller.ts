import { TableRowItem } from "virtual-table-react";

export interface Controller {

}

export const makeTableViewItems = (items: TableRowItem[]) => {
    return items.map((n, i) => ({...n, index: i}))

}