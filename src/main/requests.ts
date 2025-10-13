import path from 'path'

import { retrieveExifDatas } from './exif.js'
import { cancel, ErrorType, getDrives, getFilesAsync } from 'filesystem-utilities'

type GetFiles = {
    folderId: string,
    requestId: number,
    path: string,
    showHidden?: boolean
}

type CancelExifs = {
    requestId: number
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
                const items = await getFilesAsync(normalizedPath, getfiles.showHidden == true)
                retrieveExifDatas(getfiles.folderId, getfiles.requestId, items)
                return writeJson(items)
            case "json://cancelexifs/":
                const cancelExifs = await request.json() as CancelExifs
                cancel(`${cancelExifs.requestId}`)
                return writeJson({})
                break
            default:
                return writeJson({ code: 0, msg: "Allgemeiner Fehler aufgetreten"})
        }
    } catch (e) {
        const err = e as ErrorType
        return writeJson({ code: err.code, message: err.message })
    }
}

function writeJson(msg: any) {
    return new Response(JSON.stringify(msg), {
        headers: { 'Content-Type': 'application/json' }
    })
}
