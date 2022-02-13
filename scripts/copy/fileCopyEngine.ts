import { FolderItem } from "../components/folder"
import { Engine } from "../engines/engines"
import { CopyEngine } from "./copy"

export class FileCopyEngine implements CopyEngine {
    constructor(private engine: Engine, private other: Engine, private move?: boolean) { 


        // TODO
        console.log("Hallo", this.engine, this.other, this.move)
    }

    async process(selectedItems: FolderItem[]) {
        return true
    }
}