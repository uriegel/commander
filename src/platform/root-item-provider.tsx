import { isWindows } from "./platform"
import { linuxGetColumns, linuxRenderRow } from "./linux/file-item-provider"
import { windowsGetColumns, windowsRenderRow } from "./windows/file-item-provider"

export const getColumns = isWindows ? windowsGetColumns : linuxGetColumns
export const renderRow = isWindows ? windowsRenderRow : linuxRenderRow
