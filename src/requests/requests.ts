import {
    type AddNetworkShareInput,
    type App,
    type CmdInput, type CopyFile, type CopyInput, type CopyItem, type CreateFolderInput, type CreateRemoteFolderInput, type DeleteInput,
    type DirectoryItem, type ExtendCopyItemsInput, type ExtendedRenameInput, type ExtendedRenameItem, type ExtendedRenameOutput, type FlatCopyItem, type FlattenItemsInput,
    type GetAccentColorOutput, type GetFilesInput, type GetItemsFinishedInput, type GetItemsOutput, type getRecommendedAppsInput, type MountInput,
    type MountOutput, type NullData, type OnEnterInput, type OpenFileInput, type RenameInput, type SystemError
} from "./model"

export const cmdRequest = (cmd: string) => jsonRequest<CmdInput, NullData>("cmd", { cmd })
export const getDrives = () => jsonRequest<NullData, GetItemsOutput>("getdrives", {})
export const getAccentColor = () => jsonRequest<NullData, GetAccentColorOutput>("getaccentcolor", {})
export const mountRequest = (device: string) => jsonRequest<MountInput, MountOutput>("mount", { device })
export const onEnter = (name: string, path: string, openWith?: boolean, showProperties?: boolean) => jsonRequest<OnEnterInput, NullData>("onenter", { name, path, openWith, showProperties })
export const getFiles = (folderId: string, requestId: number, path: string, showHidden?: boolean) => jsonRequest<GetFilesInput, GetItemsOutput>("getfiles", { folderId, requestId, path, showHidden })
export const copy = (sourcePath: string, targetPath: string, items: CopyFile[], move: boolean) => jsonRequest<CopyInput, NullData>(
    "copy", { sourcePath, targetPath, items, move })
export const deleteRequest = (path: string, items: string[]) => jsonRequest<DeleteInput, NullData>("delete", { path, items })
export const renameRequest = (path: string, item: string, newName: string, asCopy?: boolean) => jsonRequest<RenameInput, NullData>("rename", { path, item, newName, asCopy })
export const createFolderRequest = (path: string, item: string) => jsonRequest<CreateFolderInput, NullData>("createfolder", { path, item })
export const flattenItems = (path: string, targetPath: string, items: CopyItem[]) => jsonRequest<FlattenItemsInput, FlatCopyItem[]>("flattenitems", { path, targetPath, items })
export const cancelBackground = () => jsonRequest<NullData, NullData>("cancelbackground", {})
export const extendedRenameRequest = (path: string, items: ExtendedRenameItem[]) => jsonRequest<ExtendedRenameInput, ExtendedRenameOutput>("extendedrename", { path, items })
export const getItemsFinished = (folderId: string) => jsonRequest<GetItemsFinishedInput, NullData>("getitemsfinished", { folderId })
export const addNetworkShare = (share: string, name: string, passwd: string) => jsonRequest<AddNetworkShareInput, NullData>("addnetworkshare", { share, name, passwd })
export const getRemoteFiles = (folderId: string, requestId: number, path: string, showHidden?: boolean) => jsonRequest<GetFilesInput, GetItemsOutput>(
    "getremotefiles", { folderId, requestId, path, showHidden })
export const createRemoteFolderRequest = (path: string, item: string) => jsonRequest<CreateRemoteFolderInput, NullData>("createremotefolder", { path, item })
export const remoteDeleteRequest = (path: string, items: string[]) => jsonRequest<DeleteInput, NullData>("remotedelete", { path, items })
export const extendCopyItems = (items: string[]) => jsonRequest<ExtendCopyItemsInput, DirectoryItem[]>("extendcopyitems", { items })
export const copyFromRemote = (sourcePath: string, targetPath: string, items: CopyFile[]) => jsonRequest<CopyInput, NullData>(
    "copyfromremote", { sourcePath, targetPath, items, move: false })
export const copyToRemote = (sourcePath: string, targetPath: string, items: CopyFile[]) => jsonRequest<CopyInput, NullData>(
    "copytoremote", { sourcePath, targetPath, items, move: false })
export const closeWindow = () => jsonRequest<NullData, NullData>("closewindow", {})
export const minimize = () => jsonRequest<NullData, NullData>("minimize", {})
export const maximize = () => jsonRequest<NullData, NullData>("maximize", {})
export const restore = () => jsonRequest<NullData, NullData>("restore", {})
export const getRecommendedApps = (file: string) => jsonRequest<getRecommendedAppsInput, App[]>("getrecommendedapps", { file })
export const getAllApps = () => jsonRequest<NullData, App[]>("getallapps", {})
export const openFile = (executable: string, file: string) => jsonRequest<OpenFileInput, NullData>("openfile", { executable, file })
export const sendErrorText = (text: string) => jsonRequest<string, NullData>("seterrortext", text)

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

