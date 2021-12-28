const isLinux = process.platform == "linux"

import {
    initializeCopying as initializeCopyingLinux,
    adaptWindow as adaptWindowLinux,
    onDarkTheme as onDarkThemeLinux,
    adaptRootColumns as adaptRootColumnsLinux,
    adaptDirectoryColumns as adaptDirectoryColumnsLinux,
    adaptConflictColumns as adaptConflictColumnsLinux,
    getRootPath as getRootPathLinux,
    pathDelimiter as pathDelimiterLinux,
    parentIsRoot as parentIsRootLinux,
    adaptDisableSorting as adaptDisableSortingLinux,
    addExtendedInfo as addExtendedInfoLinux,
    deleteItems as deleteItemsLinux,
    copyItems as copyItemsLinux,
    renameItem as renameItemLinux,
    deleteEmptyFolders as deleteEmptyFoldersLinux,
    enhanceCopyConflictData as enhanceCopyConflictDataLinux
} from "./linux"
import {
    initializeCopying as initializeCopyingWindows,
    adaptWindow as adaptWindowWindows,
    onDarkTheme as onDarkThemeWindows,
    adaptRootColumns as adaptRootColumnsWindows,
    adaptDirectoryColumns as adaptDirectoryColumnsWindows,
    adaptConflictColumns as adaptConflictColumnsWindows,
    getRootPath as getRootPathWindows,
    pathDelimiter as pathDelimiterWindows,
    parentIsRoot as parentIsRootWindows,
    adaptDisableSorting as adaptDisableSortingWindows,
    addExtendedInfo as addExtendedInfoWindows,
    deleteItems as deleteItemsWindows,
    copyItems as copyItemsWindows,
    renameItem as renameItemWindows,
    deleteEmptyFolders as deleteEmptyFoldersWindows,
    enhanceCopyConflictData as enhanceCopyConflictDataWindows
} from "./windows"

export { hideMenu } from "./linux"
export var initializeCopying = isLinux ? initializeCopyingLinux : initializeCopyingWindows
export var adaptWindow = isLinux ? adaptWindowLinux : adaptWindowWindows
export var onDarkTheme = isLinux ? onDarkThemeLinux : onDarkThemeWindows
export var adaptRootColumns = isLinux ? adaptRootColumnsLinux : adaptRootColumnsWindows
export var adaptDirectoryColumns = isLinux ? adaptDirectoryColumnsLinux : adaptDirectoryColumnsWindows
export var adaptConflictColumns = isLinux ? adaptConflictColumnsLinux : adaptConflictColumnsWindows
export var getRootPath = isLinux ? getRootPathLinux : getRootPathWindows
export var pathDelimiter = isLinux ? pathDelimiterLinux : pathDelimiterWindows
export var parentIsRoot = isLinux ? parentIsRootLinux : parentIsRootWindows
export var adaptDisableSorting = isLinux ? adaptDisableSortingLinux : adaptDisableSortingWindows
export var addExtendedInfo = isLinux ? addExtendedInfoLinux : addExtendedInfoWindows
export var deleteItems = isLinux ? deleteItemsLinux : deleteItemsWindows
export var copyItems = isLinux ? copyItemsLinux : copyItemsWindows
export var renameItem = isLinux ? renameItemLinux : renameItemWindows
export var deleteEmptyFolders = isLinux ? deleteEmptyFoldersLinux : deleteEmptyFoldersWindows
export var enhanceCopyConflictData = isLinux ? enhanceCopyConflictDataLinux : enhanceCopyConflictDataWindows


    