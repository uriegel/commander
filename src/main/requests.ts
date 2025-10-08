import path from 'path'
import { getDrives } from "./drives.js"
import type * as RustAddonType from 'rust'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const addon = require('rust') as typeof RustAddonType

type GetFiles = {
    path: string
}

export const onRequest = async (request: Request) => {
	if (request.method != 'POST') 
        return writeJson({ ok: false })
    switch (request.url) {
        case "json://getdrives/":
            const drives = await getDrives()
            return writeJson({ items: drives, path: "root" })
        case "json://getfiles/":
            const getfiles = await request.json() as GetFiles
            const normalizedPath =  path.normalize(getfiles.path)
            const items = await addon.getFilesAsync(normalizedPath)
            return writeJson(items)
        default:
            return writeJson({ ok: false })
    }
}

function writeJson(msg: any) {
    return new Response(JSON.stringify(msg), {
        headers: { 'Content-Type': 'application/json' }
    })
}
