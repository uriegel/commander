import {
    cancel, copyFile, copyFiles, createFolder, FileItem, getDrives, getFiles, openFile,
    openFileWith, rename, showFileProperties, SystemError, trash
} from 'filesystem-utilities'
import { spawn } from "child_process"
import path from 'path'
import { retrieveExifDatas } from './exif.js'
import { AsyncEnumerable } from 'functional-extensions'
import { filter, interval, merge, Observable, Subscriber, throttle } from 'rxjs'
import { copyItems } from './copy.js'

type GetFiles = {
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
                const normalizedPath = path.normalize(getfiles.path)
                const items = await getFiles(normalizedPath, getfiles.showHidden == true)
                items.items = items.items.map(n => ({
                    ...n, 
                    iconPath: getIconPath(n.name, items.path)
                }))
                retrieveExifDatas(getfiles.folderId, getfiles.requestId, items)
                return writeJson(items)
            case "json://cancelexifs/":
                const cancelExifs = await request.json() as { requestId: number }
                cancel(`${cancelExifs.requestId}`)
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
                const input = await request.json() as { requestId: number, sourcePath: string, targetPath: string, items: string[], totalSize: number, move: boolean }
                await copyItems(input.requestId, input.sourcePath, input.targetPath, input.items, input.totalSize, input.move)
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
                const subscribers = new Set<Subscriber<{ idx: number, current: number, total: number }>>
                const flattened = await input
                    .items
                    .toAsyncEnumerable()
                    .bind(n => n.isDirectory ? flattenDirectory(input.path, input.targetPath, n) : [n].toAsyncEnumerable())
                    .await()
                return writeJson(flattened)
            }
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

function getIconPath(name: string, filePath: string) {
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
	
