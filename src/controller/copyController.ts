import { time } from "console"
import * as R from "ramda"
import { DialogHandle, Slide } from "web-dialog-react"
import Conflicts, { ConflictItem } from "../components/Conflicts"
import { FolderViewItem } from "../components/FolderView"
import { Controller, ControllerType } from "./controller"
import { getItemsType, ItemsType } from "./filesystem"
import { IOError } from "./requests"

export interface CopyController {
    copy: ()=>Promise<IOError|null>
}

export const getCopyController = (move: boolean, dialog: DialogHandle|null, fromLeft: boolean, fromController?: Controller, toController?: Controller,
    sourcePath?: string, targetPath?: string, items?: FolderViewItem[], targetItems?: FolderViewItem[]): CopyController|null => {
    if (fromController?.type == ControllerType.FileSystem && toController?.type == ControllerType.FileSystem)
        return getFileSystemCopyController(move, dialog, fromLeft, fromController, toController, sourcePath, targetPath, items, targetItems)
    else
        return null
}

const getFileSystemCopyController = (move: boolean, dialog: DialogHandle|null, fromLeft: boolean, fromController?: Controller, toController?: Controller,
    sourcePath?: string, targetPath?: string, items?: FolderViewItem[], targetItems?: FolderViewItem[]): CopyController | null => ({
        copy: async () => {
            if (!items || !targetItems || items.length == 0)
                return null
            
            const targetItemsMap = R.mergeAll(targetItems.map(ti => ({ [ti.name]: ti })))
            const conflictItems = items.map(n => {
                const check = targetItemsMap[n.name]
                return check
                ? {
                    name: n.name,
                    size: n.size,
                    time: n.time,
                    exifDate: n.exifDate,
                    version: n.version,
                    targetSize: check.size,
                    targetTime: check.time,
                    targetExifDate: check.exifDate,
                    targetVersion: check.version
                }
                : undefined                
            }).filter(n => n != undefined) as ConflictItem[]

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
            const result = await dialog?.show({
                text,
                slide: fromLeft ? Slide.Left : Slide.Right,
                extension: conflictItems.length ? Conflicts : undefined,
                extensionProps: conflictItems, 
                fullscreen: conflictItems.length > 0,
                btnYes: true,
                btnNo: true,
                btnCancel: true,
                defBtnYes: true
            })
                    
            return null
        }
    })

