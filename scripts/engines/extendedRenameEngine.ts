import { ExtendedInfo } from "../components/extendedrename"
import { Platform } from "../platforms/platforms"
import { EngineId } from "./engines"
import { FileEngine } from "./file"

export class ExtendedRenameEngine extends FileEngine {

    constructor(folderId: string, extendedInfo: ExtendedInfo) {
        super(EngineId.Files, `${folderId}-external`)
    }

    override isSuitable(path: string|null|undefined, extendedRename?: ExtendedInfo) { return Platform.isFileEnginePath(path) && extendedRename !== null }

        // TODO
        // if (extendedRename) 
        //     columns.splice(1, 0, { name: "Neuer Name", render: (td, item) => { td.innerHTML = item.newName || ""}})

}
