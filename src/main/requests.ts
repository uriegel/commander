import { cancel, getDrives, getFilesAsync, openFile, openFileWith, showFileProperties, SystemError } from 'filesystem-utilities'
import { spawn } from "child_process"
import path from 'path'
import { retrieveExifDatas } from './exif.js'

type GetFiles = {
    folderId: string,
    requestId: number,
    path: string,
    showHidden?: boolean
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
                const items = await getFilesAsync(normalizedPath, getfiles.showHidden == true)
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


	

