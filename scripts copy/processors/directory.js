export const DIRECTORY_TYPE = "directory"
import { formatDateTime, formatSize, getExtension, compareVersion } from "./rendertools.js"
import { ROOT } from "./root.js"
import { FILE, DIRECTORY } from '../commander.js'
import {
    pathDelimiter,
    adaptDirectoryColumns,
    parentIsRoot,
    adaptDisableSorting,
    createFolder as platformCreateFolder,
    addExtendedInfo as addAdditionalInfo,
    deleteItems as platformDeleteItems,
    copyItems as platformCopyItems,
    renameItem as platformRenameItem,
    deleteEmptyFolders as platformDeleteEmptyFolders,
    enhanceCopyConflictData,
    onEnter as platformOnEnter
} from "../platforms/switcher.js"


    const onEnter = file => {
        platformOnEnter(file, currentPath)
    }


