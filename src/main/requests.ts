import {
    addNetworkShare,
    cancel, copyFile, copyFiles, createFolder, FileItem, getDrives, getFiles, openFile,
    openFileWith, rename, showFileProperties, SystemError, trash
} from 'filesystem-utilities'
import { spawn } from "child_process"
import path from 'path'
import { retrieveExifDatas } from './exif.js'
import { AsyncEnumerable, createSemaphore } from 'functional-extensions'
import { withProgress } from './copy.js'
import { ExtendedRenameItem } from '@/renderer/items-provider/items.js'
import { retrieveVersions } from './version.js'
import { Semaphore } from "functional-extensions"
import { closeWindow } from './index.js'
import { copyFromRemote, createRemoteFolder, getRemoteFiles, remoteDelete } from './remote.js'

export const getItemsSemaphores = new Map<string, Semaphore>()

export type GetFiles = {
    folderId: string,
    requestId: number,
    path: string,
    showHidden?: boolean
}

type CopyItem = {
    idx:            number
    name:           string
    isDirectory:   boolean    
    iconPath?:      string
    time?:          Date
    size?:          number
    targetTime?:    Date
    targetSize?:    number
}

export const onRequest = async (request: Request) => {
    try {
        if (request.method != 'POST')
            return writeJson({ error: "UNKNOWN", message: "HTTP-Methode POST verlangt!"})
        switch (request.url) {
            case "json://getdrives/":
                const drives = await getDrives()
                return writeJson({ items: drives, path: "root" })
            case "json://getfiles/":
                const getfiles = await request.json() as GetFiles
                getItemsSemaphores.get(getfiles.folderId)?.release()
                getItemsSemaphores.set(getfiles.folderId, createSemaphore(0, 1))
                const normalizedPath = path.normalize(getfiles.path)
                const items = await getFiles(normalizedPath, getfiles.showHidden == true)
                items.items = items.items.map(n => ({
                    ...n, 
                    iconPath: getIconPath(n.name, items.path)
                }))
                const retrieveExtended = async () => {
                    await retrieveExifDatas(getfiles.folderId, getfiles.requestId.toString(), items)
                    if (process.platform == "win32")
                        await retrieveVersions(getfiles.folderId, getfiles.requestId.toString(), items)
                }
                retrieveExtended()
                return writeJson(items)
            case "json://cancelexifs/":
                const cancelExifs = await request.json() as { requestId: number }
                cancel(`${cancelExifs.requestId}`)
                return writeJson({})
            case "json://cancelcopy/":
                cancel("copy")
                return writeJson({})
            case "json://mount/": {
                const dev = await request.json() as { dev: string }
                const path = await mount(dev.dev)
                return writeJson({ path })
            }
            case "json://onenter/": {
                const input = await request.json() as { name: string, path: string, openWith?: boolean, showProperties?: boolean }
                if (input.openWith)
                    openFileWith(path.join(input.path, input.name))
                else if (input.showProperties)
                    showFileProperties(path.join(input.path, input.name))
                else
                    openFile(path.join(input.path, input.name))
                return writeJson({})
            }
            case "json://copy/": {
                const input = await request.json() as { sourcePath: string, targetPath: string, items: string[], totalSize: number, move: boolean }
                await withProgress(input.items, input.totalSize, input.move,
                    async (progressCallback: (idx: number, currentBytes: number, totalBytes: number) => void) =>
                        copyFiles(input.sourcePath, input.targetPath, input.items, {
                            move: input.move, overwrite: true, cancellation: "copy", progressCallback
                        }))
                return writeJson({})
            }
            case "json://delete/": {
                const input = await request.json() as { path: string, items: string[] }
                for (const n of input.items)
                    await trash(path.join(input.path, n))
                return writeJson({})
            }
            case "json://rename/": {
                const input = await request.json() as { path: string, item: string, newName: string, asCopy?: boolean }
                if (!input.asCopy)
                    await rename(input.path, input.item, input.newName)
                else
                    await copyFile(path.join(input.path, input.item), path.join(input.path, input.newName))
                return writeJson({})
            }
            case "json://createfolder/": {
                const input = await request.json() as { path: string, item: string }
                await createFolder(path.join(input.path, input.item))
                return writeJson({})
            }
            case "json://flattenitems/": {
                const input = await request.json() as { path: string, targetPath: string, items: CopyItem[] }
                const flattened = await input
                    .items
                    .toAsyncEnumerable()
                    .bind(n => n.isDirectory ? flattenDirectory(input.path, input.targetPath, n) : [n].toAsyncEnumerable())
                    .await()
                return writeJson(flattened)
            }
            case "json://extendedrename/": {
                const input = await request.json() as { path: string, items: ExtendedRenameItem[] }
                for (const item of input.items) {
                    if (item.newName)
                        await rename(input.path, item.name, "__RENAMING__" + item.newName)
                }
                for (const item of input.items) {
                    if (item.newName)
                        await rename(input.path, "__RENAMING__"+ item.newName, item.newName)
                }
                return writeJson({ success: true })
            }
            case "json://getitemsfinished/":
                const input = await request.json() as { folderId: string }
                getItemsSemaphores.get(input.folderId)?.release()
                return writeJson({})
            case "json://addnetworkshare/": {
                const input = await request.json() as { share: string, name: string, passwd: string }
                await addNetworkShare(input.share, input.name, input.passwd)
                return writeJson({})
            }
            case "json://getremotefiles/": {
                const res = await getRemoteFiles(await request.json())
                return writeJson(res)
            }
            case "json://createremotefolder/": {
                const input = await request.json() as { path: string, item: string }
                await createRemoteFolder(input.path, input.item)
                return writeJson({})
            }
            case "json://remotedelete/": {
                const input = await request.json() as { path: string, items: string[] }
                await remoteDelete(input.path, input.items)
                return writeJson({})
            }
            case "json://copyfromremote/": {
                const input = await request.json() as { sourcePath: string, targetPath: string, items: string[], totalSize: number }
                copyFromRemote(input.sourcePath, input.targetPath, input.items, input.totalSize)
                return writeJson({})
            }
            case "json://closewindow/":
                closeWindow()
                return writeJson({})
            default:
                return writeJson({ error: "UNKNOWN" , message: "Allgemeiner Fehler aufgetreten"})
        }
    } catch (e) {
        const err = e as SystemError
        return writeJson({
            message: err.message,
            error: err.error,
            nativeError: err.nativeError
        })
    }
}

export function getExtension(filename: string) {
    const index = filename.lastIndexOf(".")
    return index > 0 ? filename.substring(index) : ""
}

export function writeJson(msg: any) {
    return new Response(JSON.stringify(msg), {
        headers: { 'Content-Type': 'application/json' }
    })
}

export function getIconPath(name: string, filePath: string) {
    const ext = getExtension(name)
    return ext.toLowerCase() == ".exe"
        ? process.platform == 'win32' ? path.join(filePath, name) : ext
        : ext
}

const mount = async (drive: string) => new Promise<string>((res, rej) => {
	let scriptOutput = ""
	let scriptError = ""
	const ud = spawn("udisksctl", ["mount",  "-b" , `/dev/${drive}`])   
	ud.stdout.on("data", data => scriptOutput += data.toString())
	ud.stderr.on("data", data => scriptError += data.toString())
    ud.on("close", code => {
        console.log("Could not mount", scriptError)
        if (code) {
            if (scriptError.includes("already mounted"))
                rej({ nativeError: code, error: "UNKNOWN", message: "Bereits eingehangen" })
            else
                rej({ nativeError: code, error: "UNKNOWN", message: scriptError })
        }
		else
			res(scriptOutput.substringAfter(" at ").trimEnd())
	})
})

const flattenDirectory = (sourcePath: string, targetPath: string, dir: FileItem): AsyncEnumerable<CopyItem> => {
    const flatten = async () => {
        const directory = path.join(sourcePath, dir.name)
        const items = await getFiles(directory, true)        
        let targetItems: FileItem[]| undefined
        try {
            targetItems = (await getFiles(path.join(targetPath, dir.name), true)).items
        } catch {}
        const targetItemsDictionary = targetItems ? new Map(targetItems.map(n => [path.join(dir.name, n.name), n])) : undefined
        return items
            .items
            .map(n => ({ ...n, name: path.join(dir.name, n.name), iconPath: getIconPath(n.name, directory) }))
            .map(n => {
                const target = targetItemsDictionary?.get(n.name)
                return target ? { ...n, targetSize: target.size, targetTime: target.time } : { ...n }
            })
    }

    return AsyncEnumerable
        .from(flatten())
    .bind(n => n.isDirectory ? flattenDirectory(sourcePath, targetPath, n) : [n].toAsyncEnumerable())
}
	
