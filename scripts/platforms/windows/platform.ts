import { Column, VirtualTable } from 'virtual-table-component'
import { DialogBox } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { CopyConflict, FileInfo } from '../../components/copyconflicts'
import { FolderItem } from '../../components/folder'
import { CopyItem } from '../../copy/fileCopyEngine'
import { FileItem } from '../../engines/file'
import { RootItem } from '../../engines/root'
import { activateClass } from '../../utils'
import { Platform } from "../platforms"
const fspath = window.require('path')
const { getFileVersion, getDrives } = window.require('rust-addon')

type Version = {
    major: number 
    minor: number
    build: number
    patch: number
}

interface WindowsFileItem extends FileItem {
    version: Version
}

export class WindowsPlatform implements Platform {

    readonly pathDelimiter = '\\'

    adaptWindow(_: DialogBox, /*activeFolderSetFocusToSet, */ menuToSet: Menubar, itemHideMenu: MenuItem) {
        itemHideMenu.isHidden = true
    }

    async hideMenu(_: boolean) {}

    onDarkTheme(dark: boolean) {
        activateClass(document.body, "windows-dark", dark) 
        activateClass(document.body, "windows", !dark) 
    }

    async getDrives() {
        return await getDrives()
    }

    adaptRootColumns(columns: Column<FolderItem>[]) { return columns}

    adaptDirectoryColumns(columns: Column<FolderItem>[]) { 
        return [
            ...columns.slice(0, columns.length), {
                name: "Version",
                isSortable: true,
                sortIndex: 4,
                render: (td: HTMLTableCellElement, item: FolderItem) => td.innerHTML = fillVersion((item as WindowsFileItem).version)
            }
        ]
    }

    async getRootPath(item: RootItem) { return item.name }

    isFileEnginePath(path: string|null|undefined) {
        return !!path && path[0] == ':'
    }    

    parentIsRoot(path: string) {
        return path.length == 3 && path[1] == ':'
    }

    disableSorting(table: VirtualTable<FolderItem>, disable: boolean) {
        table.disableSorting(3, disable)
    }

    async addAdditionalInfo(item: FileItem, name: string, path: string) { 
        if (name.endsWith(".exe") || name.endsWith(".dll"))
            (item as WindowsFileItem).version = await getFileVersion(fspath.join(path, item.name))
    }

    getAdditionalSortFunction(column: number, _: boolean): (([a, b]: FolderItem[]) => number) | null { 
        return column == 4 
            ? ([a, b]: FolderItem[]) => compareVersion((a as WindowsFileItem).version, (b as WindowsFileItem).version)
            : null
    }

    async renameFile(item: string, newName: string) {
        await runCmd({
            method: "rename", 
            item,
            newName
        })
    }

    async deleteFiles(items: string[]) {
        return runCmd({
            method: "trash", 
            items,
        })
    }

    async createFolder(newFolder: string) {
        return runCmd({
            method: "createFolder", 
            path: newFolder
        })        
    }

    async enhanceFileInfo(item: FileInfo) {
        return {
            ...item,
            version: await getFileVersion(item.file)
        } as WindowsFileInfo
    }

    async copyItems(copyInfo: CopyItem[], overwrite: boolean, _: any, move?: boolean) {
        await runCmd({
            method: "copy", 
            copyInfo,
            move: move || false,
            overwrite
        })
    }

    adaptConflictsColumns(columns: Column<CopyConflict>[]) { return [
        ...columns.slice(0, columns.length), {
            name: "Version",
            isSortable: true,
            sortIndex: 4,
            render: (td, item) => {
                const template = document.getElementById('conflictItem') as HTMLTemplateElement
                const element = template.content.cloneNode(true) as HTMLElement
                const source = element.querySelector("div:first-child")!
                source.innerHTML = fillVersion((item.source as WindowsFileInfo).version)
                const target = element.querySelector("div:last-child")!
                target.innerHTML = fillVersion((item.target as WindowsFileInfo).version)
    
                var diff = compareVersion((item.source as WindowsFileInfo).version, (item.target as WindowsFileInfo).version)
                if (diff == 0)
                    td.classList.add("equal")
                else if (diff > 0)
                    source.classList.add("overwrite")
                else 
                    target.classList.add("not-overwrite")
                td.appendChild(element)
            }
        } as Column<CopyConflict>
    ]}

    async copyFileAsync(source: string, target: string, cb?: (progress: number)=>void, move?: boolean, overwrite?: boolean) {}
    deleteEmptyFolders(path: string, folders: string[], foldersToRefresh: string[]) {
        // TODO 
        // await runCmd({
        //     method: "deleteEmptyFolders", 
        //     path,
        //     folders
        // })
        // onFinish(foldersToRefresh)
    }
}

function fillVersion(version: Version) {
    return version ? `${version.major}.${version.minor}.${version.build}.${version.patch}` : ""
}

function compareVersion(versionLeft: Version, versionRight: Version) {
    return !versionLeft
        ? -1
        : !versionRight
        ? 1
        : versionLeft.major != versionRight.major 
        ? versionLeft.major - versionRight.major
        : versionLeft.minor != versionRight.minor
        ? versionLeft.minor - versionRight.minor
        : versionLeft.patch != versionRight.patch
        ? versionLeft.patch - versionRight.patch
        : versionLeft.build - versionRight.build
}

async function runCmd(input: any) {
    const response = await fetch("http://runcmd", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
    })
    const res = await response.json()
    if (res.exception)
        throw (res.exception)
}

interface WindowsFileInfo extends FileInfo {
    version: Version
}