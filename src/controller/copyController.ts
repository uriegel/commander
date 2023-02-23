import { FolderViewItem } from "../components/FolderView"
import { Controller, ControllerType } from "./controller"
import { IOError } from "./requests"

export interface CopyController {
    copy: ()=>Promise<IOError|null>
}

export const getCopyController = (fromController?: Controller, toController?: Controller,
    sourcePath?: string, targetPath?: string, items?: FolderViewItem[]): CopyController|null => {
    if (fromController?.type == ControllerType.FileSystem && toController?.type == ControllerType.FileSystem)
        return getFileSystemCopyController(fromController, toController, sourcePath, targetPath, items)
    else
        return null
}

const getFileSystemCopyController = (fromController?: Controller, toController?: Controller,
    sourcePath?: string, targetPath?: string, items?: FolderViewItem[]): CopyController | null => ({
        copy: async () => {
            return null
        }
    })

