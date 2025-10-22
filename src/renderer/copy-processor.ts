import { DialogHandle, ResultType, Slide } from "web-dialog-react"
import { FolderViewHandle } from "./components/FolderView"
import { ID_LEFT } from "./components/Commander"
import { copy, flattenItems } from "./requests/requests"
import { FILE } from "./items-provider/file-item-provider"
import { getSelectedItemsText } from "./items-provider/provider"
import { SystemError } from "filesystem-utilities"
import { FileItem } from "./items-provider/items"
import CopyConflicts from "./components/dialogs/CopyConflicts"

export type CopyItem = {
    name:           string
    isDirectory?:   boolean    
    iconPath?:      string
    time?:          string
    size?:          number
    targetTime?:    string
    targetSize?:    number
}

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
    await Promise.all([
        sourceFolder.refresh(),
        targetFolder.refresh()
    ])
    let items = makeCopyItems(sourceFolder?.getSelectedItems() as FileItem[], targetFolder.getItems() as FileItem[])
    if (items.length == 0)
        return

    try {
        const copyText = getSelectedItemsText(items)
        if (items.findIndex(n => n.isDirectory) != -1)
            items = await flattenItems(sourceFolder.getPath(), targetFolder.getPath(), items)
        const copyConflicts = items.filter(n => n.targetTime)

        const defNo = copyConflicts.length > 0
            && copyConflicts
                .findIndex(n => (n.time ?? "") < (n.targetTime ?? "")) != -1

        const res = await dialog.show({
            text: `Möchtest Du ${copyText} ${move ? "verschieben" : "kopieren"}?`,
            slide: sourceFolder.id == ID_LEFT ? Slide.Left : Slide.Right,
            extension: copyConflicts.length ? CopyConflicts : undefined,
            extensionProps: copyConflicts,
            fullscreen: copyConflicts.length > 0,
            btnYes: copyConflicts.length > 0,
            btnNo: copyConflicts.length > 0,
            btnOk: copyConflicts.length == 0,
            btnCancel: true,
            defBtnYes: !defNo && copyConflicts.length > 0,
            defBtnNo: defNo
        })
        if (res.result == ResultType.Cancel)
            return

        await copy(15, sourceFolder.getPath(), targetFolder.getPath(), items.map(n => n.name), move)
        targetFolder.refresh()
        if (move)
            sourceFolder.refresh()


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

const makeCopyItems = (items: FileItem[], targetItems: FileItem[]): CopyItem[] => {
    const targetItemsDictionary = new Map(targetItems.map(n => [n.name, n]))    
    return items.map(n => {
        const target = targetItemsDictionary.get(n.name)
        return target ? {...n, targetSize: target.size, targetTime: target.time} : {...n}
    })
}
