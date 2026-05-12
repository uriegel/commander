import type { CopyItem } from "../../requests/model"
import { formatVersion } from "./file-item-provider"

export const getWindowsSpecificConflictsColumns = () => [
    { name: "Version" }
]

export const additionalWindowsRowItems = (item: CopyItem) => [
    (<div className={item.targetVersion?.build == item.fileVersion?.build 
                        && item.targetVersion?.minor == item.fileVersion?.minor 
                        && item.targetVersion?.major == item.fileVersion?.major && 
                        item.targetVersion?.patch == item.fileVersion?.patch ? "equal" : ""}>
            <div>{formatVersion(item.fileVersion)}</div>
            <div>{formatVersion(item.targetVersion)}</div>
        </div>)
    ]
    
    