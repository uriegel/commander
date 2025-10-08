import { FileItem } from "../items-provider/items"

type RequestItem = {
    items: FileItem[],
    path: string
}

export const cmdRequest = async (cmd: string) => await fetch(`cmd://${cmd}`, { method: 'POST' })

export const getDrives = () => jsonRequest<RequestItem>("getdrives", {})
export const getFiles = (path: string) => jsonRequest<RequestItem>("getfiles", { path })

const jsonRequest =  async <T>(cmd: string, msg: any) => {
    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
    }
    const response = await fetch(`json://${cmd}`, payload)
    return response.json() as T
}