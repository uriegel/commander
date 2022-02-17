import { Result } from "web-dialog-box"
import { dialog } from "../commander"
import { CopyConflict } from "../components/copyconflicts"
import { FolderItem } from "../components/folder"
import { Engine } from "../engines/engines"
import { FileItem, getItemsTypes } from "../engines/file"
import { CopyEngine } from "./copy"
import { copyProcessor } from "./copyProcessor"
import { CopyInfo, CopyItem, prepareCopyItems } from "./fileCopyEngine"
const fspath = window.require('path')
const fs = window.require('fs')
const { stat } = window.require('fs/promises')

interface ExternalCopyItem extends CopyItem {
    file: string,
    name: string,
    size: number,
    time: Date,    
    targetFile: string,
    targetExists: boolean
}

export class ExternalFileCopyEngine implements CopyEngine {
    constructor(private engine: Engine, private other: Engine, private fromLeft: boolean, private move?: boolean) {}

    async process(selectedItems: FolderItem[], focus: ()=>void, folderIdsToRefresh: string[]) {
        const itemsToCopy = selectedItems.filter(n => n.isDirectory == false)
        if (itemsToCopy.length == 0)
            return false
        const itemsType = getItemsTypes(selectedItems)
        const items = await this.extractFilesInFolders(this.engine.currentPath, this.other.currentPath, selectedItems)
        const conflicts = await this.getCopyConflicts(items, this.engine.currentPath)
        const copyInfo = { items: items as CopyItem[], conflicts } as CopyInfo
        await prepareCopyItems(itemsType, copyInfo, selectedItems.length == 1, this.fromLeft, this.move)
        const res = await dialog.show(copyInfo.dialogData)
        focus()
        if (res.result != Result.Cancel) {
            if (res.result == Result.No) 
                copyInfo.items = copyInfo.items.filter(n => !copyInfo.conflicts.find(m => m.source.file == n.file))
            copyInfo.items.forEach(n => copyProcessor.addExternalJob(n.file, n.targetFile, this.move == true, res.result == Result.Yes, folderIdsToRefresh))
            return true
        } else 
            return false
    }

    private async extractFilesInFolders(sourcePath: string, targetPath: string, selectedItems: FolderItem[]): Promise<ExternalCopyItem[]> {
        const paths = (await Promise.all((selectedItems as FileItem[]).map(async n => {
            const file = fspath.join(sourcePath, n.name)
            const targetFile = fspath.join(targetPath, n.name)
            return { file, 
                    name: n.name,
                    time: new Date(n.exifTime ?? n.time),
                    size: n.size,
                    targetFile, 
                    targetExists: fs.existsSync(targetFile)
                } 
        }))).flatMap(n => n)
        return paths
    }

    private async getCopyConflicts(copyItems: ExternalCopyItem[], sourcePath: string) {
        const conflicts = copyItems.filter(n => n.targetExists)
        const sources = await this.getExternalFilesInfos(conflicts, sourcePath)
        const targets = await this.getFilesInfos(conflicts.map(n => n.targetFile))
        return sources.map((n, i) => ({source: n, target: targets[i]})) as CopyConflict[]
    }

    private async getExternalFilesInfos(conflicts: ExternalCopyItem[], subPath?: string) {
        const getFileInfos = (file: ExternalCopyItem) => {
            return {  
                file: file.file,       
                name: file.name,
                size: file.size,
                time: file.time
            }
        }
        return conflicts.map(getFileInfos)
    }

    private async getFilesInfos(files: string[], subPath?: string) {
        const getFileInfos = async (file: string) => {
            const info = await stat(file)
            return {  
                file,       
                name: subPath ? file.substring(subPath.length + 1) : undefined,
                size: info.size,
                time: info.mtime,
            }
        }
        return await Promise.all(files.map(getFileInfos))
    }
}


