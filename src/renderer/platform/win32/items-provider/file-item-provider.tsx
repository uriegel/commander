import Credentials, { CredentialsProps } from "@/renderer/components/dialogs/Credentials"
import IconName from "@/renderer/components/IconName"
import { FileItem, IconNameType } from "@/renderer/items-provider/items"
import { formatDateTime, formatSize } from "@/renderer/items-provider/provider"
import { addNetworkShare } from "@/renderer/requests/requests"
import { SystemError, VersionInfo } from "filesystem-utilities"
import { delayAsync, retryOnErrorAsync } from "functional-extensions"
import { delay } from "rxjs"
import { DialogHandle, ResultType } from "web-dialog-react"

export const appendPath = (path: string, subPath: string) => {
    return path.endsWith("\\") || subPath.startsWith('\\')
        ? path + subPath
        : path + "\\" + subPath
}

export const getColumns = () => [
        { name: "Name", isSortable: true, subColumn: "Erw." },
        { name: "Datum", isSortable: true },
        { name: "Größe", isSortable: true, isRightAligned: true },
        { name: "Version", isSortable: true }        
    ]

export const renderRow = (item: FileItem) => [
	(<IconName namePart={item.name} type={
			item.isParent
			? IconNameType.Parent
			: item.isDirectory
			? IconNameType.Folder
			: IconNameType.File}
		iconPath={item.iconPath} />),
	(<span className={item.exifData?.dateTime ? "exif" : "" } >{formatDateTime(item?.exifData?.dateTime ?? item?.time)}</span>),
	formatSize(item.size),
    formatVersion(item.fileVersion)
]

export const sortVersion = (a: FileItem, b: FileItem) =>
    a.fileVersion && !b.fileVersion
    ? 1
    : !a.fileVersion && b.fileVersion   
    ? -1
    : a.fileVersion && b.fileVersion   
    ? a.fileVersion.major > b.fileVersion.major
    ? 1
    : a.fileVersion.major < b.fileVersion.major
    ? -1
    : a.fileVersion.minor > b.fileVersion.minor
    ? 1                
    : a.fileVersion.minor < b.fileVersion.minor
    ? -1                
    : a.fileVersion.build > b.fileVersion.build
    ? 1                
    : a.fileVersion.build < b.fileVersion.build
    ? -1                
    : a.fileVersion.patch > b.fileVersion.patch
    ? 1                
    : a.fileVersion.patch < b.fileVersion.patch
    ? -1                
    : 0
    : 0            

const formatVersion = (version?: VersionInfo) => 
    version ? `${version.major}.${version.minor}.${version.build}.${version.patch}` : ""

export const onGetItemsError = async (e: unknown, share: string, dialog?: DialogHandle, setErrorText?: (msg: string)=>void) => {
    if (!dialog || !setErrorText)
        throw "wrong parameters"
	const se = e as SystemError
    if (se.error != "ACCESS_DENIED"&& se.error != "WRONG_CREDENTIALS")
        throw e

    await retryOnErrorAsync(async () => {
        let name = ""
        let password = ""

        const res = await dialog?.show({
            text: "Netzwerklaufwerk verbinden",
            extension: Credentials,
            extensionProps: { name, password },
            onExtensionChanged: (e: CredentialsProps) => {
                name = e.name
                password = e.password
            }, 
            btnOk: true,
            btnCancel: true,
            defBtnOk: true,      
        })
        if (res?.result == ResultType.Cancel) 
            return
        await addNetworkShare(share, name, password)
    }, async e => {
        const se = e as SystemError
        if (setErrorText)
            setErrorText(se.message)
    }, 3)
}


