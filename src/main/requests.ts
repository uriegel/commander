import path from 'path'
import { getDrives } from "./drives.js"
import type * as RustAddonType from 'rust'
import { createRequire } from 'module'
import { extractErrorFromException } from './error.js'
const require = createRequire(import.meta.url)
const addon = require('rust') as typeof RustAddonType

type GetFiles = {
    requestId: number,
    path: string,
    showHidden?: boolean
}

export const onRequest = async (request: Request) => {
    try {
        if (request.method != 'POST')
            return writeJson({ code: 0, msg: "HTTP-Methode POST verlangt!"})
        switch (request.url) {
            case "json://getdrives/":
                const drives = await getDrives()
                return writeJson({ items: drives, path: "root" })
            case "json://getfiles/":
                const getfiles = await request.json() as GetFiles
                const normalizedPath = path.normalize(getfiles.path)
                const items = await addon.getFilesAsync(normalizedPath, getfiles.showHidden == true)
                return writeJson(items)
            default:
                return writeJson({ code: 0, msg: "Allgemeiner Fehler aufgetreten"})
        }
    } catch (e) {
        const err = extractErrorFromException(e)
        return writeJson(err)
    }
}

function writeJson(msg: any) {
    return new Response(JSON.stringify(msg), {
        headers: { 'Content-Type': 'application/json' }
    })
}
