import { showDialog } from "web-dialog-react"
import { FolderViewItem } from "../components/FolderView"
import { Controller, ControllerType } from "./controller"
import { getItemsType, ItemsType } from "./filesystem"
import { IOError } from "./requests"

export interface CopyController {
    copy: ()=>Promise<IOError|null>
}

export const getCopyController = (move: boolean, fromController?: Controller, toController?: Controller,
    sourcePath?: string, targetPath?: string, items?: FolderViewItem[]): CopyController|null => {
    if (fromController?.type == ControllerType.FileSystem && toController?.type == ControllerType.FileSystem)
        return getFileSystemCopyController(move, fromController, toController, sourcePath, targetPath, items)
    else
        return null
}

const getFileSystemCopyController = (move: boolean, fromController?: Controller, toController?: Controller,
    sourcePath?: string, targetPath?: string, items?: FolderViewItem[]): CopyController | null => ({
        copy: async () => {
            const copyText = move ? "verschieben" : "kopieren"
            const type = getItemsType(items ?? [])
            const text = type == ItemsType.Directory
            ? `Möchtest Du das Verzeichnis ${copyText}?`
            : type == ItemsType.Directories
            ? `Möchtest Du die Verzeichnisse ${copyText}?`
            : type == ItemsType.File
            ? `Möchtest Du die Datei ${copyText}?`
            : type == ItemsType.Files
            ? `Möchtest Du die Dateien ${copyText}?`
            : `Möchtest Du die Verzeichnisse und Dateien ${copyText}?`
            const result = await showDialog({
                text,
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })
                    
            return null
        }
    })

