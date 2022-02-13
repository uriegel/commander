import { FolderItem } from "../components/folder";
import { Engine, EngineId } from "../engines/engines"
import { FileCopyEngine } from "./fileCopyEngine"

export interface CopyEngine {
    process: (selectedItems: FolderItem[])=>Promise<boolean>
}

export function getCopyEngine(engine: Engine, other: Engine, fromLeft: boolean, move?: boolean): CopyEngine | null {
    if (engine.id == EngineId.Files && other.id == EngineId.Files)
        return new FileCopyEngine(engine, other, fromLeft, move)
    return null;
}