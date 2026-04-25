import { ExtendedRenameItem } from "../items-provider/items"
import { CopyItem } from "../copy-processor"
import { CmdInput, DirectoryItem, GetAccentColorOutput, GetFilesInput, GetItemsFinishedInput, GetItemsOutput, NullData, SystemError } from "./model"

type MountResult = {
    path: string
}

export const cmdRequest = (cmd: string) => jsonRequest<CmdInput, NullData>("cmd", { cmd })
export const getDrives = () => jsonRequest<NullData, GetItemsOutput>("getdrives", {})
export const getAccentColor = () => jsonRequest<NullData, GetAccentColorOutput>("getaccentcolor", {})
export const mountRequest = (dev: string) => jsonRequestA<MountResult>("mount", { dev })
export const onEnter = (name: string, path: string, openWith?: boolean, showProperties?: boolean) => jsonRequestA<void>("onenter", { name, path, openWith, showProperties })
export const getFiles = (folderId: string, requestId: number, path: string, showHidden?: boolean) => jsonRequest<GetFilesInput, GetItemsOutput>("getfiles", { folderId, requestId, path, showHidden })
export const copy = (sourcePath: string, targetPath: string, items: string[], totalSize: number, move: boolean) => jsonRequestA<void>(
    "copy", { sourcePath, targetPath, items, totalSize, move })
export const deleteRequest = (path: string, items: string[]) => jsonRequestA<void>("delete", { path, items })
export const renameRequest = (path: string, item: string, newName: string, asCopy?: boolean) => jsonRequestA<void>("rename", { path, item, newName, asCopy })
export const createFolderRequest = (path: string, item: string) => jsonRequestA<void>("createfolder", { path, item })
export const flattenItems = (path: string, targetPath: string, items: CopyItem[]) => jsonRequestA<CopyItem[]>("flattenitems", { path, targetPath, items })
export const cancelBackground = () => jsonRequestA<void>("cancelbackground", {})
export const extendedRenameRequest = (path: string, items: ExtendedRenameItem[]) => jsonRequestA<{success: boolean}>("extendedrename", { path, items })
export const getItemsFinished = (folderId: string) => jsonRequest<GetItemsFinishedInput, NullData>("getitemsfinished", { folderId })
export const addNetworkShare = (share: string, name: string, passwd: string) => jsonRequestA<void>("addnetworkshare", { share, name, passwd })
export const getRemoteFiles = (folderId: string, requestId: number, path: string, showHidden?: boolean) => jsonRequestA<GetItemsOutput>("getremotefiles", { folderId, requestId, path, showHidden })
export const createRemoteFolderRequest = (path: string, item: string) => jsonRequestA<void>("createremotefolder", { path, item })
export const remoteDeleteRequest = (path: string, items: string[]) => jsonRequestA<void>("remotedelete", { path, items })
export const extendCopyItems = (path: string, items: DirectoryItem[]) => jsonRequestA<DirectoryItem[]>("extendcopyitems", { path, items })
export const copyFromRemote = (sourcePath: string, targetPath: string, items: string[], totalSize: number) => jsonRequestA<void>(
    "copyfromremote", { sourcePath, targetPath, items, totalSize })
export const copyToRemote = (sourcePath: string, targetPath: string, items: string[], totalSize: number) => jsonRequestA<void>(
    "copytoremote", { sourcePath, targetPath, items, totalSize })
export const closeWindow = () => jsonRequest<NullData, NullData>("closewindow", {})
export const minimize = () => jsonRequest<NullData, NullData>("minimize", {})
export const maximize = () => jsonRequest<NullData, NullData>("maximize", {})
export const restore = () => jsonRequest<NullData, NullData>("restore", {})
//export const getAllApps = () => jsonRequest<App[]>("getallapps", {})
export const openFile = (executable: string, file: string) => jsonRequestA<void>("openfile", { executable, file })


const jsonRequest = async <TIn, TOut>(cmd: string, msg: TIn) => {
    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
    }
    const response = await fetch(`http://localhost:8080/requests/${cmd}`, payload)
    const res = await response.json() as (TOut | SystemError)
    if ((res as SystemError).error && (res as SystemError).message) {
        throw (res)
    }
    return res as TOut
}

const jsonRequestA = async <T>(cmd: string, msg: unknown) => await fetch(`http://localhost:8080/requests/${cmd}`) as T
