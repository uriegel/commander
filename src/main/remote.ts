import fs from 'fs'
import path from 'path'
import { Transform } from "stream"
import { FileItem, FileItemsResult, SystemError } from 'native'
import { GetFiles, getIconPath } from './requests.js'

export const getRemoteFiles = async (input: GetFiles) => {
    const baseUrl = input.path.substring(7).substringUntil('/')
    const remotePath = path.normalize('/' + input.path.substring(7).substringAfter('/')).replaceAll("\\", "/")
    const items = await remoteGetRequest<FileItem[]>(baseUrl, `/getfiles${remotePath}`)
    const dirCount = items.filter(n => n.isDirectory).length
    return {
        items: items
            .filter(n => input.showHidden || !n.isHidden)
            .map(n => ({
                ...n,
                time: n.time ? new Date(n.time) : undefined,
                iconPath: getIconPath(n.name, "")
            })),
        dirCount,
        fileCount: items.length - dirCount,
        path: `remote/${baseUrl}${remotePath}`
    } as FileItemsResult
}

export const createRemoteFolder = async (filePath: string, item: string) => {
    const baseUrl = filePath.substring(7).substringUntil('/')
    const remotePath = path.normalize(`/${filePath.substring(7).substringAfter('/')}/${item}`).replaceAll("\\", "/")
    await remotePostRequest(baseUrl, `/createdirectory${remotePath}`)
}

export const remoteDelete = async (remoteFile: string) => {
    const baseUrl = remoteFile.substring(7).substringUntil('/')
    const remotePath = path.normalize(`/${remoteFile.substring(7).substringAfter('/')}/`).replaceAll("\\", "/")
    await remoteDeleteRequest(baseUrl, `/deletefile${remotePath}`)
}

export const copyFromRemote = async (sourcePath: string, targetPath: string, items: string[],
        progressCallback: (idx: number, currentBytes: number, totalBytes: number)=>void) => {
    try {
        remoteWorking = true
        const baseUrl = sourcePath.substring(7).substringUntil('/')
        const remotePath = path.normalize(`/${sourcePath.substring(7).substringAfter('/')}/`).replaceAll("\\", "/")
        let idx = -1
        for (let n of items) {
            idx++
            if (!remoteWorking)
                throw { error: "CANCELLED", message: "Aktion wurde abgebrochen", nativeError: -1 } as SystemError

            const response = await fetch(`http://${baseUrl}/downloadfile${remotePath}${n}`)
            if (!response.ok) 
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)

            const total = Number(response.headers.get("content-length"))
            const date = Number(response.headers.get("x-file-date"))
            const reader = response.body?.getReader()
            let downloaded = 0
            const fileStream = fs.createWriteStream(`${targetPath}/${n}`)
            while (true && reader) {
                const { done, value } = await reader.read()
                if (done)
                    break
                downloaded += value.length
                fileStream.write(value)
                progressCallback(idx, downloaded, total)
            }
            const mtime = new Date(date)
            fileStream.close(() => fs.utimesSync(`${targetPath}/${n}`, mtime, mtime))
        }
    } catch (e) {
        throw makeSystemError(e)
    }
    finally {
        remoteWorking = false
    }
}

export const copyToRemote = async (sourcePath: string, targetPath: string, items: string[],
        progressCallback: (idx: number, currentBytes: number, totalBytes: number)=>void) => {
    try {
        remoteWorking = true
        const baseUrl = targetPath.substring(7).substringUntil('/')
        const remotePath = path.normalize(`/${targetPath.substring(7).substringAfter('/')}/`).replaceAll("\\", "/")
        let idx = -1
        for (let n of items) {
            idx++
            const stat = await fs.promises.stat(`${sourcePath}/${n}`)
            const total = stat.size
            let uploaded = 0
            
            if (!remoteWorking)
                throw { error: "CANCELLED", message: "Aktion wurde abgebrochen", nativeError: -1 } as SystemError

            const fileStream = fs.createReadStream(`${sourcePath}/${n}`)
            const progressStream = new Transform({
                transform(chunk, _, callback) {
                    uploaded += chunk.length
                    progressCallback(idx, uploaded, total)                    
                    callback(null, chunk)
                }
            })
            fileStream.pipe(progressStream)

            const response = await fetch(`http://${baseUrl}/putfile${remotePath}${n}`, {
                method: "PUT",
                body: progressStream as unknown as BodyInit,
                headers: {
                    "Content-Length": total.toString(),
                    "x-file-date": Math.floor(stat.mtimeMs).toString()
                },
                duplex: "half"
            } as RequestInit & { duplex: "half" })
            if (!response.ok) 
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
        }
    } catch (e) {
        throw makeSystemError(e)
    }
    finally {
        remoteWorking = false
    }
}

export const remoteCancel = () => remoteWorking = false

const remoteGetRequest = async <T>(baseUrl: string, path: string) => remoteJsonRequest<T>(baseUrl, path, "GET")
const remotePostRequest = async (baseUrl: string, path: string) => remoteRequest(baseUrl, path, "POST")
const remoteDeleteRequest = async (baseUrl: string, path: string) => remoteRequest(baseUrl, path, "DELETE")

const remoteJsonRequest = async <T>(baseUrl: string, path: string, method: string) => {
    try {
        const response = await fetch(`http://${baseUrl}${path}`, { method })
        const res = await response.json() as (T | SystemError)
        if ((res as SystemError).error && (res as SystemError).message) {
            throw (res)
        }
        return res as T
    } catch (e) {
        throw makeSystemError(e)
    }
}

const remoteRequest = async (baseUrl: string, path: string, method: string) => {
    await fetch(`http://${baseUrl}${path}`, { method })
}

const makeSystemError = (e: unknown) => {
    const ete = ((e as TypeError).cause as { code: string })?.code
    if (ete)
        return {
            error: "UNKNOWN",
            message: ete == "ECONNREFUSED"
                ? "Keine Verbindung zum entfernten Gerät"
                : ete == "ENETUNREACH"
                    ? "Unbekanntes Netzwerk"
                    : ete == "EHOSTUNREACH"
                        ? "Unbekanntes Gerät"
                        : "Fehler aufgetreten",
            nativeError: 99
        } as SystemError
    else
        return { error: "UNKNOWN", message: (e as any).message, nativeError: -1 } as SystemError
}

let remoteWorking = false