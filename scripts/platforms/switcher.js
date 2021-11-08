const isLinux = process.platform == "linux"

import {
    adaptWindow as adaptWindowLinux,
    onDarkTheme as onDarkThemeLinux,
    adaptRootColumns as adaptRootColumnsLinux,
    adaptDirectoryColumns as adaptDirectoryColumnsLinux,
    getRootPath as getRootPathLinux,
    pathDelimiter as pathDelimiterLinux,
    parentIsRoot as parentIsRootLinux,
    adaptDisableSorting as adaptDisableSortingLinux,
    addExtendedInfo as addExtendedInfoLinux,
    deleteItems as deleteItemsLinux
} from "./linux"
import {
    adaptWindow as adaptWindowWindows,
    onDarkTheme as onDarkThemeWindows,
    adaptRootColumns as adaptRootColumnsWindows,
    adaptDirectoryColumns as adaptDirectoryColumnsWindows,
    getRootPath as getRootPathWindows,
    pathDelimiter as pathDelimiterWindows,
    parentIsRoot as parentIsRootWindows,
    adaptDisableSorting as adaptDisableSortingWindows,
    addExtendedInfo as addExtendedInfoWindows,
    deleteItems as deleteItemsWindows
} from "./windows"

export { hideMenu } from "./linux"
export var adaptWindow = isLinux ? adaptWindowLinux : adaptWindowWindows
export var onDarkTheme = isLinux ? onDarkThemeLinux : onDarkThemeWindows
export var adaptRootColumns = isLinux ? adaptRootColumnsLinux : adaptRootColumnsWindows
export var adaptDirectoryColumns = isLinux ? adaptDirectoryColumnsLinux : adaptDirectoryColumnsWindows
export var getRootPath = isLinux ? getRootPathLinux : getRootPathWindows
export var pathDelimiter = isLinux ? pathDelimiterLinux : pathDelimiterWindows
export var parentIsRoot = isLinux ? parentIsRootLinux : parentIsRootWindows
export var adaptDisableSorting = isLinux ? adaptDisableSortingLinux : adaptDisableSortingWindows
export var addExtendedInfo = isLinux ? addExtendedInfoLinux : addExtendedInfoWindows
export var deleteItems = isLinux ? deleteItemsLinux : deleteItemsWindows



    