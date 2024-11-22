import { DialogHandle, Slide, ResultType, DialogResult } from "web-dialog-react"
import CopyConflicts, { ConflictItem } from "../../components/dialogparts/CopyConflicts"
import { FolderViewItem } from "../../components/FolderView"
import { Controller, ControllerType, ItemsType, getItemsType } from "../controller"
import { compareVersion } from "../filesystem"
import { IOError } from "../../requests/requests"
import { copy, CopyItem } from "./fileSystem"
import { AsyncResult, Err, ErrorType, Nothing, Ok, mergeToDictionary, nothing } from "functional-extensions"
//import { copyInfoFromRemote } from "./fromRemoteCopy"
//import { copyInfoToRemote } from "./toRemoteCopy"


export const getCopyController = (fromController: Controller, toController: Controller): CopyController|null =>
    fromController.type == ControllerType.FileSystem && toController.type == ControllerType.FileSystem
    ? new CopyController(fromController, toController)
    : fromController.type == ControllerType.Remote && toController.type == ControllerType.FileSystem
    ? new CopyController(fromController, toController)
    : fromController.type == ControllerType.FileSystem && toController.type == ControllerType.Remote
    ? new CopyController(fromController, toController)
    : null

class CopyController {

    constructor(
        private fromController: Controller,
        private toController: Controller) { }
    
    copy(move: boolean, dialog: DialogHandle, fromLeft: boolean, sourcePath: string, targetPath: string,
        items: FolderViewItem[], targetItems: FolderViewItem[]): AsyncResult<Nothing, ErrorType> {
        
        const fileItems = items
            .filter(n => !n.isDirectory)
        const totalSize = fileItems
            .map(n => n.size || 0)
            .reduce((a, c) => a + c, 0)
                    
        
        // TODO GetConflictItems: when path does start with "remote", get items from rust
        // Get sizes from all sources
        // get sizes form targets if available
        // get exif from sources and targets if available (Windows)
        const targetItemsMap = mergeToDictionary(
            targetItems
                .filter(n => !n.isDirectory)
                .map(ti => ({ key: ti.name, value: ti })))
        const conflictFileItems = fileItems.map(n => {
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
        const conflictItems = conflictFileItems //dirInfos ? conflictFileItems.concat(dirInfos) : conflictFileItems
     
        


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
                ? makeDialogResult(res, fileItems, conflictItems)
                : new Err<CopyItem[], ErrorType>({ status: IOError.Cancelled, statusText: "" }))
            .bindAsync(copyItems =>
                copyItems.length > 0
                ? copy(sourcePath, targetPath, copyItems, getJobType(this.fromController.type, this.toController.type, move))
                : AsyncResult.from(new Ok<Nothing, ErrorType>(nothing)))        
    }
}

export enum JobType
{
    Copy,
    Move,
    CopyToRemote,
    MoveToRemote, //?
    CopyFromRemote,
    MoveFromRemote //?
}

export interface CopyController1 {
    copy: () => AsyncResult<Nothing, ErrorType>
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
    return new Ok<CopyItem[], ErrorType>(
        res.result == ResultType.Yes
        ? itemsToCopy
        : itemsToCopy.diff(
            conflictItems.map(n => ({
                name: n.name,
                size: n.size || 0
            }))
        )
    )
}            
