import * as R from "ramda"
import { DialogHandle, Slide } from "web-dialog-react"
import Conflicts from "../components/Conflicts"
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
            const diff = R.innerJoin((a, b) => a.name == b.name,
                items ?? [], targetItems ?? [])    
            
            
            
            const copyText = diff.length > 0
                ? move ? "Verschieben" : "Kopieren"
                : move ? "verschieben" : "kopieren"
            const type = getItemsType(items ?? [])
            const text = diff.length > 0 
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
                //extended: diff.length ? Conflicts() : undefined,
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })
                    
            return null
        }
    })

