import { DialogHandle, ResultType, Slide } from "web-dialog-react"
import { FolderViewHandle } from "./components/FolderView"
import { ID_LEFT } from "./components/Commander"
import { copy } from "./requests/requests"
import { FILE } from "./items-provider/file-item-provider"
import { getSelectedItemsText } from "./items-provider/provider"
import { SystemError } from "filesystem-utilities"

export const copyItems = async (sourceFolder: FolderViewHandle | null, targetFolder: FolderViewHandle | null,
        move: boolean, dialog: DialogHandle, setErrorText: (txt: string)=>void) => {
    const sourceProvider = sourceFolder?.getCurrentItemsProvider()
    const targetProvider = targetFolder?.getCurrentItemsProvider()
    if (sourceProvider?.id != FILE || targetProvider?.id != FILE)
        return
    const sourceAppendPath = sourceFolder?.getAppendPath()
    const targetAppendPath = sourceFolder?.getAppendPath()
    if (sourceFolder == null || targetFolder == null || sourceAppendPath == null || targetAppendPath == null)
        return
    const items = sourceFolder?.getSelectedItems()
    if (items.length == 0)
        return
    await Promise.all([
        sourceFolder.refresh(),
        targetFolder.refresh()
    ])

    try {
        // TODO resolve and flatten tree structure
        // TODO check conflicts
        const res = await dialog.show({
            //text: controller.current.getCopyText(prepareResult, move),
            text: `Möchtest Du ${getSelectedItemsText(items)} ${move ? "verschieben" : "kopieren"}?`,
            slide: sourceFolder.id == ID_LEFT ? Slide.Left : Slide.Right,
            //extension: prepareResult.conflicts.length ? CopyConflicts : undefined,
            // extensionProps: prepareResult.conflicts.map(n => ({
            //     name: n.source.name.getFileName(),
            //     subPath: n.source.name.getParentPath(),
            //     iconPath: n.source.name,
            //     size: n.source.size,
            //     time: n.source.time,
            //     targetSize: n.target.size,
            //     targetTime: n.target.time
            // }) as ConflictItem),
            //fullscreen: prepareResult.conflicts.length > 0,
            //btnYes: prepareResult.conflicts.length > 0,
            //btnNo: prepareResult.conflicts.length > 0,
            //btnOk: prepareResult.conflicts.length == 0,
            btnOk: true,
            btnCancel: true,
            //defBtnYes: !defNo && prepareResult.conflicts.length > 0,
            //defBtnNo: defNo
        })
        if (res.result == ResultType.Cancel)
            return

        // const source = items.map(n => sourceAppendPath(sourceFolder.getPath(), n.name))
        // const target = items.map(n => targetAppendPath(targetFolder.getPath(), n.name))
        await copy(15, sourceFolder.getPath(), targetFolder.getPath(), items.map(n => n.name), move)
        targetFolder.refresh()
        if (move)
            sourceFolder.refresh()

        // const defNo = prepareResult.conflicts.length > 0
        //     && prepareResult
        //         .conflicts
        //         .filter(n => (n.source.time ?? "") < (n.target.time ?? ""))
        //         .length > 0

        // const result = await copy({ id, cancelled: res.result == ResultType.Cancel, notOverwrite: res.result == ResultType.No })
        // if (!result.cancelled) {
        //     inactiveFolder.refresh()
        //     if (move)
        //         refresh()
        // }
    } catch (e) {
        const err = e as SystemError
        setErrorText(err.message)
    }
}
