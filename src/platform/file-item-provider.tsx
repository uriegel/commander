import { isWindows } from "./platform"
import { linuxAppendPath, linuxGetColumns, linuxOnGetItemsError, linuxRenderRow, linuxSortVersion } from "./linux/file-item-provider"
import { windowsAppendPath, windowsGetColumns, windowsOnGetItemsError, windowsRenderRow, windowsSortVersion } from "./windows/file-item-provider"

export const appendPath = isWindows ? windowsAppendPath : linuxAppendPath
export const getColumns = isWindows ? windowsGetColumns : linuxGetColumns
export const renderRow = isWindows ? windowsRenderRow : linuxRenderRow
export const onGetItemsError = isWindows ? windowsOnGetItemsError : linuxOnGetItemsError
export const sortVersion = isWindows ? windowsSortVersion : linuxSortVersion
