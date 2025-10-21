import { SystemError } from "filesystem-utilities"
import { FileItem } from "../items-provider/items"

type RequestItem = {
    items: FileItem[],
    path: string,
    dirCount: number,
    fileCount: number
}

type MountResult = {
    path: string
}

export const cmdRequest = async (cmd: string) => await fetch(`cmd://${cmd}`, { method: 'POST' })

export const getDrives = () => jsonRequest<RequestItem>("getdrives", {})
export const mountRequest = (dev: string) => jsonRequest<MountResult>("mount", { dev })
export const onEnter = (name: string, path: string, openWith?: boolean, showProperties?: boolean) => jsonRequest<void>("onenter", {name, path, openWith, showProperties })
export const getFiles = (folderId: string, requestId: number, path: string, showHidden?: boolean) => jsonRequest<RequestItem>("getfiles", { folderId, requestId, path, showHidden })
export const cancelExifs = (requestId: number) => jsonRequest<void>("cancelExifs", { requestId })
export const copy = (requestId: number, sourcePath: string, targetPath: string, items: string[], move: boolean) => jsonRequest<void>(
    "copy", { requestId, sourcePath, targetPath, items, move })
export const deleteRequest = (path: string, items: string[]) => jsonRequest<void>("delete", { path, items })
export const renameRequest = (path: string, item: string, newName: string, asCopy?: boolean) => jsonRequest<void>("rename", { path, item, newName, asCopy })
export const createFolderRequest = (path: string, item: string) => jsonRequest<void>("createfolder", { path, item })

const jsonRequest =  async <T>(cmd: string, msg: unknown) => {
    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
    }
    const response = await fetch(`json://${cmd}`, payload)
    const res = await response.json() as (T | SystemError)
    if ((res as SystemError).error && (res as SystemError).message) {
        throw (res)
    }
    return res as T
}