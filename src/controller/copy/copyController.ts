import * as R from "ramda"
import { DialogHandle, Slide, ResultType, DialogResult } from "web-dialog-react"
import CopyConflicts, { ConflictItem } from "../../components/dialogparts/CopyConflicts"
import { FolderViewItem } from "../../components/FolderView"
import { Controller, ControllerType } from "../controller"
import { compareVersion, getItemsType, ItemsType } from "../filesystem"
import { CopyItem, IOError } from "../../requests/requests"
import { copy, copyInfo } from "./fileSystem"
import { AsyncResult, Err, ErrorType, Nothing, Ok } from "functional-extensions"

export interface CopyController {
    copy: () => AsyncResult<Nothing, ErrorType>
}

const getCopyFunction = (from: ControllerType, to: ControllerType) =>
    from == ControllerType.Remote && to == ControllerType.FileSystem
    // TODO copyFromRemote
    ? copy
    : from == ControllerType.FileSystem && to == ControllerType.Remote
    // TODO copyToRemote
    ? copy
    : copy    

const getPreCopyFunction = (from: ControllerType, to: ControllerType) =>
    from == ControllerType.Remote && to == ControllerType.FileSystem
    // TODO ? copyInfoFromRemote
    ? copyInfo
    : from == ControllerType.FileSystem && to == ControllerType.Remote
    // TODO? copyInfoToRemote
    ? copyInfo
    : copyInfo

export const getCopyController = (move: boolean, dialog: DialogHandle, fromLeft: boolean, fromController: Controller, toController: Controller,
    sourcePath: string, targetPath: string, items: FolderViewItem[], targetItems: FolderViewItem[]): CopyController|null => {
    return fromController.type == ControllerType.FileSystem && toController.type == ControllerType.FileSystem
        || fromController.type == ControllerType.Remote && toController.type == ControllerType.FileSystem
        || fromController.type == ControllerType.FileSystem && toController.type == ControllerType.Remote
    ? getFileSystemCopyController(move, dialog, fromLeft, fromController, toController, sourcePath, targetPath,
        items, targetItems?.filter(n => !n.isDirectory),
        getPreCopyFunction(fromController.type, toController.type),
        getCopyFunction(fromController.type, toController.type))
    : null
}

const getFileSystemCopyController = (move: boolean, dialog: DialogHandle, fromLeft: boolean, _: Controller, __: Controller,
            sourcePath: string, targetPath: string, items: FolderViewItem[], targetItems: FolderViewItem[],
            copyInfo: (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean)=>AsyncResult<CopyItem[], ErrorType>,
            copy: (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean)=>AsyncResult<Nothing, ErrorType>): CopyController | null => ({
        copy: () => {
            const copyItems = items
                .filter(n => n.isDirectory)
                .map(n => ({
                    name: n.name,
                    isDirectory: true,
                    size: n.size,
                    time: n.time
                }))
                    
            return copyInfo(sourcePath, targetPath, copyItems, move)
                .bindAsync(infos => {
                    const fileItems = items
                        .filter(n => !n.isDirectory)
                    const totalSize = fileItems
                        .map(n => n.size || 0)
                        .concat((infos ?? []).map(n => n.size || 0))
                        .reduce((a, c) => a + c, 0)
                        
                    const targetItemsMap = R.mergeAll(
                        targetItems
                            .filter(n => !n.isDirectory)
                            .map(ti => ({ [ti.name]: ti })))
    
                    const conflictFileItems = fileItems.map(n => {
                        const check = targetItemsMap[n.name]
                        return check
                            ? {
                                name: n.name,
                                iconPath: n.iconPath,
                                size: n.size,
                                time: n.time,
                                exifDate: n.exifDate && check.exifDate ? n.exifDate : null,
                                version: n.version,
                                targetSize: check.size,
                                targetTime: check.time,
                                targetExifDate: n.exifDate && check.exifDate ? check.exifDate : null,
                                targetVersion: check.version
                            } as ConflictItem
                            : undefined                
                    }).filter(n => n != undefined) as ConflictItem[]

                    const dirInfos = infos
                                    .filter(n => n.targetSize != null)
                                    .map(n => ({
                                        name: n.name,
                                        iconPath: undefined,
                                        subPath: n.subPath,
                                        size: n.size,
                                        time: n.time,
                                        exifDate: undefined,
                                        version: undefined,
                                        targetSize: n.targetSize,
                                        targetTime: n.targetTime,
                                        targetExifDate: undefined,
                                        targetVersion: undefined
                                    })) as ConflictItem[]
                    const conflictItems = dirInfos ? conflictFileItems.concat(dirInfos) : conflictFileItems

                    const copyText = conflictItems.length > 0
                        ? move ? "Verschieben" : "Kopieren"
                        : move ? "verschieben" : "kopieren"
                    const type = getItemsType(items)
                    const text = conflictItems.length > 0 
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

                    const filterNoOverwrite = (item: ConflictItem) =>
                    (item.exifDate && item.targetExifDate
                        ? item.exifDate < item.targetExifDate
                        : (item.time ?? "") < (item.targetTime ?? ""))
                    && compareVersion(item.version, item.targetVersion) < 0
    
                    const defNo = conflictItems.length > 0
                        && conflictItems
                            .filter(filterNoOverwrite)
                            .length > 0
                    return dialog.showDialog({
                        text: `${text} (${totalSize?.byteCountToString()})`,   
                        slide: fromLeft ? Slide.Left : Slide.Right,
                        extension: conflictItems.length ? CopyConflicts : undefined,
                        extensionProps: conflictItems, 
                        fullscreen: conflictItems.length > 0,
                        btnYes: conflictItems.length > 0,
                        btnNo: conflictItems.length > 0,
                        btnOk: conflictItems.length == 0,
                        btnCancel: true,
                        defBtnYes: !defNo && conflictItems.length > 0,
                        defBtnNo: defNo
                    }, res => res.result != ResultType.Cancel
                        ? makeDialogResult(res, fileItems, infos, conflictItems)
                        : new Err<CopyItem[], ErrorType>({ status: IOError.Canceled, statusText: "" }))
                }) 
                .bindAsync(copyItems => copy(sourcePath, targetPath, copyItems, move))
        }
    })

const makeDialogResult = (res: DialogResult, fileItems: FolderViewItem[], infos: CopyItem[], conflictItems: ConflictItem[]) => {
    const itemsToCopy = fileItems
        .map(n => ({ name: n.name, size: n.size, time: n.time, subPath: undefined }) as CopyItem)
        .concat((infos?? []).map(n => ({ name: n.name, size: n.size, time: n.time, subPath: n.subPath || undefined })))

    return new Ok<CopyItem[], ErrorType>(
        res.result == ResultType.Yes
        ? itemsToCopy
        : R.without(
            conflictItems.map(n => ({ name: n.name, size: n.size, time: n.time, subPath: n.subPath || undefined })),
            itemsToCopy))
}
