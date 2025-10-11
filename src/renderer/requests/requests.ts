import { ErrorType } from "../../main/error"
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

const jsonRequest =  async <T>(cmd: string, msg: unknown) => {
    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
    }
    const response = await fetch(`json://${cmd}`, payload)
    const res = await response.json() as (T | ErrorType)
    if ((res as ErrorType).code && (res as ErrorType).msg) {
        throw (res)
    }
    return res as T
}