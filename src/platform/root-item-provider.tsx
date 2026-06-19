import { isWindows } from "./platform"
import { linuxGetColumns, linuxRenderRow, linuxDeleteItems } from "./linux/root-item-provider"
import { windowsGetColumns, windowsRenderRow, windowsDeleteItems } from "./windows/root-item-provider"

export const getColumns = isWindows ? windowsGetColumns : linuxGetColumns
export const renderRow = isWindows ? windowsRenderRow : linuxRenderRow
export const deleteItems = isWindows ? windowsDeleteItems : linuxDeleteItems