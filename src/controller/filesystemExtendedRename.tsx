import { Controller, ControllerResult, ControllerType } from "./controller";


export const getFileSystemController = (controller: Controller): ControllerResult =>
    controller.type == ControllerType.FileSystem
    ? ({ changed: true, controller: createFileSystemController(controller) })
    : ({ changed: false, controller })

const createFileSystemController = (controller: Controller): Controller => {
    return {
        type: controller.type,
        id: controller.id,
        getColumns: controller.getColumns,
        getExtendedItems: controller.getExtendedItems,
        setExtendedItems: controller.setExtendedItems,
        getItems: controller.getItems,
        onEnter: controller.onEnter,
        sort: controller.sort,
        itemsSelectable: true,
        appendPath: controller.appendPath,
        rename: controller.rename,
        extendedRename: controller.extendedRename,
        createFolder: controller.createFolder,
        deleteItems: controller.deleteItems,
    }
}
