import { getLinuxSpecificConflictsColumns } from "./linux/copy-conflicts"
import { getWindowsSpecificConflictsColumns } from "./windows/copy-conflicts"
import { isWindows } from "./platform"

export const getSpecificConflictsColumns = isWindows ? getWindowsSpecificConflictsColumns : getLinuxSpecificConflictsColumns