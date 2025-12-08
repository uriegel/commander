import { DialogHandle, ResultType, Slide } from "web-dialog-react"
import { FolderViewHandle } from "./components/FolderView"
import { ID_LEFT, ID_RIGHT } from "./components/Commander"
import { copy, copyFromRemote, copyToRemote, extendCopyItems, flattenItems } from "./requests/requests"
import { FILE, FileItemProvider } from "./items-provider/file-item-provider"
import { getSelectedItemsText } from "./items-provider/provider"
import { SystemError } from "native"
import { FileItem } from "./items-provider/items"
import CopyConflicts from "./components/dialogs/CopyConflicts"
import { canCopy } from '@platform/copy-processor'
import { REMOTE } from "./items-provider/remote-provider"

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
        move: boolean, dialog: DialogHandle, setErrorText: (txt: string) => void, backgroundAction: boolean) => {
    if (!canCopy(backgroundAction)) {
        setErrorText("Eine Hintergrundaktion ist bereits am Laufen!")
        return
    }

    const sourceProvider = sourceFolder?.getCurrentItemsProvider()
    const targetProvider = targetFolder?.getCurrentItemsProvider()
    const copyProcessor = getCopyProcessor(sourceProvider?.getId(), targetProvider?.getId())
    if (!copyProcessor)
        return

    if (!copyProcessor.canMove() && move)
        return

    const sourceAppendPath = sourceFolder?.getAppendPath()
    const targetAppendPath = targetFolder?.getAppendPath()
    if (sourceFolder == null || targetFolder == null || sourceAppendPath == null || targetAppendPath == null)
        return
    await Promise.all([
        copyProcessor.refresh(sourceFolder),
        copyProcessor.refresh(targetFolder)
    ])
    let items = makeCopyItems(sourceFolder?.getSelectedItems() as FileItem[], targetFolder.getItems() as FileItem[])
    if (items.length == 0)
        return

    if (!copyProcessor.canCopyDirectories() && items.findIndex(n => n.isDirectory) != -1)
        return

    try {
        const copyText = getSelectedItemsText(items)
        if (!move && items.findIndex(n => n.isDirectory) != -1)
            items = await flattenItems(sourceFolder.getPath(), targetFolder.getPath(), items)
        const copyConflicts = items.filter(n => n.targetTime)

        const defNo = copyConflicts.length > 0
            && copyConflicts
                .findIndex(n => (n.time?.substring(0, 16) ?? "") < (n.targetTime?.substring(0, 16) ?? "")) != -1
 
        const res = await dialog.show({
            text: copyConflicts.length ? `Einträge beim ${move ? "Verschieben" : "Kopieren"} überschreiben?` : `Möchtest Du ${copyText} ${move ? "verschieben" : "kopieren"}?`,
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

        const itemsToCopy = res.result == ResultType.No ? items.diff(copyConflicts) : items
        await copyProcessor.copy(sourceFolder.getPath(), targetFolder.getPath(), itemsToCopy.map(n => n.name), itemsToCopy.reduce((previousValue, current) => (current.size || 0) + previousValue, 0),  move)
        targetFolder.refresh()
        if (move)
            sourceFolder.refresh()
    } catch (e) {
        const err = e as SystemError
        setErrorText(err.message)
    }
}

export const onFilesDrop = async (fileList: FileList, targetFolder: FolderViewHandle | null, 
        move: boolean, dialog: DialogHandle, setErrorText: (txt: string) => void, backgroundAction: boolean) => {
    if (!canCopy(backgroundAction)) {
        setErrorText("Eine Hintergrundaktion ist bereits am Laufen!")
        return
    }

    const sourceProvider = new FileItemProvider()
    const targetProvider = targetFolder?.getCurrentItemsProvider()
    const copyProcessor = getCopyProcessor(FILE, targetProvider?.getId())
    if (!copyProcessor)
        return

    if (!copyProcessor.canMove() && move)
        return

    const sourceAppendPath = sourceProvider.appendPath
    const targetAppendPath = targetFolder?.getAppendPath()
    if (targetFolder == null || sourceAppendPath == null || targetAppendPath == null)
        return
    await copyProcessor.refresh(targetFolder)

    const path = window.env.getDropPath(fileList[0]).getParentPath()
    const files = await extendCopyItems(path, Array.from(fileList).map(f => ({
        name: f.name,
        size: f.size,
        time: (new Date(f.lastModified)).toISOString()
    } as FileItem)))
    let items = makeCopyItems(files, targetFolder.getItems() as FileItem[])
    if (items.length == 0)
        return

    if (!copyProcessor.canCopyDirectories() && items.findIndex(n => n.isDirectory) != -1)
        return

    try {
        const copyText = getSelectedItemsText(items)
        if (!move && items.findIndex(n => n.isDirectory) != -1)
            items = await flattenItems(path, targetFolder.getPath(), items)
        const copyConflicts = items.filter(n => n.targetTime)

        const defNo = copyConflicts.length > 0
            && copyConflicts
                .findIndex(n => (n.time?.substring(0, 16) ?? "") < (n.targetTime?.substring(0, 16) ?? "")) != -1
 
        const res = await dialog.show({
            text: copyConflicts.length ? `Einträge beim ${move ? "Verschieben" : "Kopieren"} überschreiben?` : `Möchtest Du ${copyText} ${move ? "verschieben" : "kopieren"}?`,
            slide: targetFolder.id == ID_RIGHT ? Slide.Left : Slide.Right,
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

        const itemsToCopy = res.result == ResultType.No ? items.diff(copyConflicts) : items
        await copyProcessor.copy(path, targetFolder.getPath(), itemsToCopy.map(n => n.name), itemsToCopy.reduce((previousValue, current) => (current.size || 0) + previousValue, 0),  move)
        targetFolder.refresh()
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

const getCopyProcessor = (sourceId?: string, targetId?: string) => 
    sourceId == FILE && targetId == FILE
    ? new CopyProcessor()
    : sourceId == REMOTE && targetId == FILE
    ? new RemoteToLocalProcessor() as ICopyProcessor
    : sourceId == FILE && targetId == REMOTE
    ? new LocalToRemoteProcessor() as ICopyProcessor
    : undefined

abstract class ICopyProcessor {
    abstract copy(sourcePath: string, targetPath: string, items: string[], totalSize: number, move: boolean): Promise<void>
    refresh(folder: FolderViewHandle) { return folder.refresh() }
    canMove() { return true }
    canCopyDirectories() { return true }
}

class CopyProcessor extends ICopyProcessor {
    copy(sourcePath: string, targetPath: string, items: string[], totalSize: number, move: boolean) {
        return copy(sourcePath, targetPath, items, totalSize, move)
    }
}

class RemoteToLocalProcessor extends ICopyProcessor {
    copy(sourcePath: string, targetPath: string, items: string[], totalSize: number) {
        return copyFromRemote(sourcePath, targetPath, items, totalSize)
    }

    async refresh() { }

    canMove() { return false }

    canCopyDirectories() { return false }
}

class LocalToRemoteProcessor extends ICopyProcessor {
    copy(sourcePath: string, targetPath: string, items: string[], totalSize: number) {
        return copyToRemote(sourcePath, targetPath, items, totalSize)
    }

    async refresh() { }

    canMove() { return false }

    canCopyDirectories() { return true }
}