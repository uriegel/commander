import { DialogHandle, Slide, ResultType, DialogResult } from "web-dialog-react"
import CopyConflicts, { ConflictItem } from "../../components/dialogparts/CopyConflicts"
import { FolderViewItem } from "../../components/FolderView"
import { Controller, ControllerType, ItemsType, getItemsType } from "../controller"
import { compareVersion } from "../filesystem"
import { IOError, RequestError, webViewRequest } from "../../requests/requests"
import { mergeToDictionary } from "functional-extensions"
//import { copyInfoFromRemote } from "./fromRemoteCopy"
//import { copyInfoToRemote } from "./toRemoteCopy"

export type CopyItem = {
    name: string,
    size: number
}

export type CopyItemResult = {
    items: FolderViewItem[],
    conflicts: ConflictItem[]
}

export const copyInfo = (sourcePath: string, targetPath: string, items: string[]) =>
    webViewRequest("copyitemsinfo", {
            path: sourcePath,
            targetPath: targetPath,
            items
    })

export const copy = (sourcePath: string, targetPath: string, items: CopyItem[], jobType: JobType) => 
    webViewRequest("copyitems", {
        path: sourcePath,
        targetPath: targetPath,
        items,
        jobType
    })

export class CopyController {

    constructor(
        private fromController: Controller,
        private toController: Controller) { }
    
    async copy(move: boolean, dialog: DialogHandle, fromLeft: boolean, sourcePath: string, targetPath: string,
        items: FolderViewItem[], targetFolderItems: FolderViewItem[]): Promise<void> {
        
        const copyItems = await this.checkCopyItems(items, targetFolderItems, sourcePath, targetPath)
        const totalSize = copyItems.items
            .map(n => n.size || 0)
            .reduce((a, c) => a + c, 0)
        
        const copyText = copyItems.conflicts.length > 0
            ? move ? "Verschieben" : "Kopieren"
            : move ? "verschieben" : "kopieren"
        const type = getItemsType(items)
        const text = copyItems.conflicts.length > 0
            ? `Einträge überschreiben beim ${copyText}?`
            : type == ItemsType.Directory
            ? `Möchtest Du das Verzeichnis ${copyText}?`
            : type == ItemsType.Directories
            ? `Möchtest Du die Verzeichnisse ${copyText}?`
            : type == ItemsType.File
            ? `Möchtest Du die Datei ${copyText}?`
            : type == ItemsType.Files
            ? `Möchtest Du die Dateien ${copyText}?`
            : `Möchtest Du die Verzeichnisse und Dateien ${copyText}?`
        const filterNoOverwrite = (item: ConflictItem) => (item.time ?? "") < (item.targetTime ?? "")
            && compareVersion(item.version, item.targetVersion) < 0
    
        const defNo = copyItems.conflicts.length > 0 && copyItems.conflicts.filter(filterNoOverwrite).length > 0
        
        const res = await dialog.show({
            text: `${text} (${totalSize?.byteCountToString()})`,
            slide: fromLeft ? Slide.Left : Slide.Right,
            extension: copyItems.conflicts.length ? CopyConflicts : undefined,
            extensionProps: copyItems.conflicts,
            fullscreen: copyItems.conflicts.length > 0,
            btnYes: copyItems.conflicts.length > 0,
            btnNo: copyItems.conflicts.length > 0,
            btnOk: copyItems.conflicts.length == 0,
            btnCancel: true,
            defBtnYes: !defNo && copyItems.conflicts.length > 0,
            defBtnNo: defNo
        })
        if (res.result == ResultType.Cancel)
            throw new RequestError(IOError.Cancelled, "")
        const itemsToCopy = makeDialogResult(res, copyItems.items, copyItems.conflicts)

        if (itemsToCopy.length > 0)
            await copy(sourcePath, targetPath, itemsToCopy, getJobType(this.fromController.type, this.toController.type, move))
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async checkCopyItems(items: FolderViewItem[], targetItems: FolderViewItem[], _sourcePath: string, _targetPath: string) {
        const resItems = items.filter(n => !n.isDirectory)
        const resTargetItems = targetItems.filter(n => !n.isDirectory)
        return {
            items: resItems,
            conflicts: this.makeConflictItems(resItems, resTargetItems)
        }
    }

    makeConflictItems(items: FolderViewItem[], targetItems: FolderViewItem[]) {
        const targetItemsMap = mergeToDictionary(targetItems.map(ti => ({ key: ti.name, value: ti })))
        const conflictFileItems = items.map(n => {
            const check = targetItemsMap[n.name]
            return check
                ? {
                    name: n.name,
                    iconPath: n.iconPath,
                    size: n.size,
                    time: n.time,
                    exifDate: n.exifData?.dateTime && check.exifData?.dateTime ? n.exifData?.dateTime : null,
                    version: n.version,
                    targetSize: check.size,
                    targetTime: check.time,
                    targetExifDate: n.exifData?.dateTime && check.exifData?.dateTime ? check.exifData?.dateTime : null,
                    targetVersion: check.version
                } as ConflictItem
                : undefined
        }).filter(n => n != undefined) as ConflictItem[]
        return conflictFileItems //dirInfos ? conflictFileItems.concat(dirInfos) : conflictFileItems
    }
}

export enum JobType
{
    Copy,
    Move,
    CopyToRemote,
    CopyFromRemote,
}

const getJobType = (from: ControllerType, to: ControllerType, move: boolean) =>
    from == ControllerType.Remote && to == ControllerType.FileSystem
    ? JobType.CopyFromRemote
    : from == ControllerType.FileSystem && to == ControllerType.Remote
    ? JobType.CopyToRemote
            : move ? JobType.Move : JobType.Copy
    
const makeDialogResult = (res: DialogResult, fileItems: FolderViewItem[], conflictItems: ConflictItem[]) => {
    const itemsToCopy = fileItems
        .map(n => ({
            name: n.name,
            size: n.size || 0
        }))
    
    const hashmap = new Map(conflictItems.map(n => [n.name, n.name]))
    
    return res.result == ResultType.Yes
        ? itemsToCopy
        : itemsToCopy.filter(n => hashmap.has(n.name) == false)
}            
