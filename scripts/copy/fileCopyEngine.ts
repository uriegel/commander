import { Result } from "web-dialog-box"
import { dialog } from "../commander"
import { CopyConflict, CopyConflicts } from "../components/copyconflicts"
import { FolderItem } from "../components/folder"
import { Engine } from "../engines/engines"
import { FileItem, getItemsTypes, ItemsType } from "../engines/file"
import { Platform } from "../platforms/platforms"
import { CopyEngine } from "./copy"
const fspath = window.require('path')
const fs = window.require('fs')
const { stat } = window.require('fs/promises')
const { getFiles } = window.require('rust-addon')

export type CopyItem = {
    file: string,
    targetFile: string,
    targetExists: boolean
}

export class FileCopyEngine implements CopyEngine {
    constructor(private engine: Engine, private other: Engine, private fromLeft: boolean, private move?: boolean) {}

    async process(selectedItems: FolderItem[], focus: ()=>void) {
        if (this.engine.currentPath == this.other.currentPath)
            return false

        const itemsType = getItemsTypes(selectedItems)
        const items = await this.extractFilesInFolders(this.engine.currentPath, this.other.currentPath, selectedItems)
        console.log("affe", items)
        const conflicts = await this.getCopyConflicts(items, this.engine.currentPath)
        const copyInfo = { items, conflicts } as CopyInfo
        await this.prepareCopyItems(itemsType, copyInfo, selectedItems.length == 1, this.fromLeft, this.move)
        const res = await dialog.show(copyInfo.dialogData)
        focus()
        if (res.result != Result.Cancel) {
            if (res.result == Result.No) 
                copyInfo.items = copyInfo.items.filter(n => !copyInfo.conflicts.find(m => m.source.file == n.file))
            await Platform.copyItems(copyInfo.items, res.result == Result.Yes, this.move)
            // if (move)
            //     await activeFolder.deleteEmptyFolders(itemsToCopy.filter(n => n.isDirectory).map(n => n.name), [activeFolder.id, inactiveFolder.id])
            return true
        } else 
            return false
    }

    private async extractFilesInFolders(sourcePath: string, targetPath: string, selectedItems: FolderItem[]): Promise<CopyItem[]> {

        const extractFiles = async (path: string, target: string) => 
            await this.extractFilesInFolders(path, target, await getFiles(path) as FileItem[])

        const paths = (await Promise.all(selectedItems.map(async n => {
            const file = fspath.join(sourcePath, n.name)
            const targetFile = fspath.join(targetPath, n.name)
            return n.isDirectory && n.name != ".."
                ? extractFiles(file, targetFile) 
                : { file, 
                    targetFile, 
                    targetExists: fs.existsSync(targetFile)
                } 
        }))).flatMap(n => n)
        return paths
    }

    private async getCopyConflicts(copyItems: CopyItem[], sourcePath: string) {
        const conflicts = copyItems.filter(n => n.targetExists)
        const sources = await this.getFilesInfos(conflicts.map(n => n.file), sourcePath)
        const targets = await this.getFilesInfos(conflicts.map(n => n.targetFile))
        return sources.map((n, i) => ({source: n, target: targets[i]})) as CopyConflict[]
    }

    private async getFilesInfos(files: string[], subPath?: string) {
        const getFileInfos = async (file: string) => {
            const info = await stat(file)
            return await Platform.enhanceFileInfo({  
                file,       
                name: subPath ? file.substring(subPath.length + 1) : undefined,
                size: info.size,
                time: info.mtime,
            })
        }
        return await Promise.all(files.map(getFileInfos))
    }

    private async prepareCopyItems(itemsType: ItemsType, copyInfo: CopyInfo, singleItem: boolean, fromLeft: boolean, move?: boolean) {
        const moveOrCopy = move ? "verschieben" : "kopieren"
        const text = copyInfo.conflicts.length == 0
            ? itemsType == ItemsType.File
                ? singleItem
                    ? `Möchtest Du die Datei ${moveOrCopy}?`
                    : `Möchtest Du die Dateien ${moveOrCopy}?`
                : itemsType == ItemsType.Directory
                ?  singleItem
                    ? `Möchtest Du den Ordner ${moveOrCopy}?`
                    : `Möchtest Du die Ordner ${moveOrCopy}?`
                : `Möchtest Du die Einträge ${moveOrCopy}?`
            : itemsType == ItemsType.File 
                ? singleItem
                    ? `Datei ${moveOrCopy}, Einträge überschreiben?`
                    : `Dateien ${moveOrCopy}, Einträge überschreiben?`
                : itemsType == ItemsType.Directory
                ?  singleItem
                    ? `Ordner ${moveOrCopy}, Einträge überschreiben?`
                    : `Ordner ${moveOrCopy}, Einträge überschreiben?`
                : `Möchtest Du die Einträge ${moveOrCopy}, Einträge überschreiben?`
        
        copyInfo.dialogData = {
            text,
            slide: fromLeft,
            slideReverse: !fromLeft,
            btnCancel: true
        }
        if (copyInfo.conflicts.length == 0) 
            copyInfo.dialogData.btnOk = true
        else {
            const copyConflicts = document.getElementById('copy-conflicts') as CopyConflicts
            copyConflicts.setItems(copyInfo.conflicts)
            copyInfo.dialogData.extended = "copy-conflicts"
            copyInfo.dialogData.btnYes = true
            copyInfo.dialogData.btnNo = true
            copyInfo.dialogData.fullscreen = true
            const notOverwrite = copyInfo.conflicts.filter(n => n.source.time.getTime() < n.target.time.getTime()).length > 0
            if (notOverwrite)
                copyInfo.dialogData.defBtnNo = true
            else
                copyInfo.dialogData.defBtnYes = true
        }
    }
}

type CopyInfo = {
    items: CopyItem[]
    conflicts: CopyConflict[]
    dialogData: DialogData
}

type DialogData = {
    btnOk?: boolean
    btnCancel?: boolean
    btnYes?: boolean
    btnNo?: boolean
    defBtnYes?: boolean
    defBtnNo?: boolean
    text?: string
    slide?: boolean
    slideReverse?: boolean
    extended?: string
    fullscreen?: true
}

