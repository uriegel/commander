import { FolderItem } from "../components/folder"
import { Engine, EngineId } from "../engines/engines"
import { ExternalFileCopyEngine } from "./externalFileCopyEngine"
import { FileCopyEngine } from "./fileCopyEngine"

export interface CopyEngine {
    process: (selectedItems: FolderItem[], focus: ()=>void, folderIdsToRefresh: string[])=>Promise<boolean>
}

export function getCopyEngine(engine: Engine, other: Engine, fromLeft: boolean, move?: boolean): CopyEngine | null {
    if (engine.id == EngineId.Files && other.id == EngineId.Files)
        return new FileCopyEngine(engine, other, fromLeft, move)
    else if (engine.id == EngineId.External && other.id == EngineId.Files)
        return new ExternalFileCopyEngine(engine, other, fromLeft, move)
    return null
}