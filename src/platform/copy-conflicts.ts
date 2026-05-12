import { additionalLinuxRowItems, getLinuxSpecificConflictsColumns } from "./linux/copy-conflicts"
import { additionalWindowsRowItems, getWindowsSpecificConflictsColumns } from "./windows/copy-conflicts"
import { isWindows } from "./platform"

export const getSpecificConflictsColumns = isWindows ? getWindowsSpecificConflictsColumns : getLinuxSpecificConflictsColumns
export const additionalRowItems = isWindows ? additionalWindowsRowItems : additionalLinuxRowItems