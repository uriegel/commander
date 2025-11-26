import { SystemError } from "filesystem-utilities"
import { ExtendedRenameItem, FileItem } from "../items-provider/items"
import { CopyItem } from "../copy-processor"

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
export const cancelExifs = (requestId: string) => jsonRequest<void>("cancelExifs", { requestId })
export const copy = (sourcePath: string, targetPath: string, items: string[], totalSize: number, move: boolean) => jsonRequest<void>(
    "copy", { sourcePath, targetPath, items, totalSize, move })
export const deleteRequest = (path: string, items: string[]) => jsonRequest<void>("delete", { path, items })
export const renameRequest = (path: string, item: string, newName: string, asCopy?: boolean) => jsonRequest<void>("rename", { path, item, newName, asCopy })
export const createFolderRequest = (path: string, item: string) => jsonRequest<void>("createfolder", { path, item })
export const flattenItems = (path: string, targetPath: string, items: CopyItem[]) => jsonRequest<CopyItem[]>("flattenitems", { path, targetPath, items })
export const cancelBackground = () => jsonRequest<void>("cancelbackground", {})
export const extendedRenameRequest = (path: string, items: ExtendedRenameItem[]) => jsonRequest<{success: boolean}>("extendedrename", { path, items })
export const getItemsFinished = (folderId: string) => jsonRequest<void>("getitemsfinished", { folderId })
export const addNetworkShare = (share: string, name: string, passwd: string) => jsonRequest<void>("addnetworkshare", { share, name, passwd })
export const getRemoteFiles = (folderId: string, requestId: number, path: string, showHidden?: boolean) => jsonRequest<RequestItem>("getremotefiles", { folderId, requestId, path, showHidden })
export const createRemoteFolderRequest = (path: string, item: string) => jsonRequest<void>("createremotefolder", { path, item })
export const remoteDeleteRequest = (path: string, items: string[]) => jsonRequest<void>("remotedelete", { path, items })
export const extendCopyItems = (path: string, items: FileItem[]) => jsonRequest<FileItem[]>("extendcopyitems", { path, items })
export const copyFromRemote = (sourcePath: string, targetPath: string, items: string[], totalSize: number) => jsonRequest<void>(
    "copyfromremote", { sourcePath, targetPath, items, totalSize })
export const copyToRemote = (sourcePath: string, targetPath: string, items: string[], totalSize: number) => jsonRequest<void>(
    "copytoremote", { sourcePath, targetPath, items, totalSize })
export const closeWindow = () => jsonRequest<void>("closewindow", {})

const jsonRequest = async <T>(cmd: string, msg: unknown) => {
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