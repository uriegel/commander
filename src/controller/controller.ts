import { TableColumns, TableRowItem } from "virtual-table-react";
import { createFileSystemController } from "./filesystem";

export enum ControllerType {
    Empty,
    FileSystem
}

export interface Controller {
    type: ControllerType
    getColumns: ()=>TableColumns
}

export const checkController = (path: string, controller: Controller|null):[boolean, Controller] => {
    return controller?.type == ControllerType.FileSystem
        ? [false, controller]
        : [true, createFileSystemController()]
}

export const createEmptyController = (): Controller => ({
    type: ControllerType.Empty,
    getColumns: () => ({
        columns: [],
        renderRow: p => [],
        measureRow: () => ""
    })
} )

export const makeTableViewItems = (items: TableRowItem[], withParent = true) => 
    (withParent
        ? [{ name: "..", index: 0 } as TableRowItem]
        : [] as TableRowItem[])
        .concat(items)
        .map((n, i) => ({ ...n, index: i }))
