import { isWindows } from "./platform"
import { linuxGetColumns, linuxRenderRow } from "./linux/root-item-provider"
import { windowsGetColumns, windowsRenderRow } from "./windows/root-item-provider"

export const getColumns = isWindows ? windowsGetColumns : linuxGetColumns
export const renderRow = isWindows ? windowsRenderRow : linuxRenderRow
