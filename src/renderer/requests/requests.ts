import { SystemError } from "filesystem-utilities"
import { FileItem } from "../items-provider/items"

type RequestItem = {
    items: FileItem[],
    path: string,
    dirCount: number,
    fileCount: number
}

export const cmdRequest = async (cmd: string) => await fetch(`cmd://${cmd}`, { method: 'POST' })

export const getDrives = () => jsonRequest<RequestItem>("getdrives", {})
export const getFiles = (folderId: string, requestId: number, path: string, showHidden?: boolean) => jsonRequest<RequestItem>("getfiles", { folderId, requestId, path, showHidden })
export const cancelExifs = (requestId: number) => jsonRequest<RequestItem>("cancelExifs", { requestId })

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