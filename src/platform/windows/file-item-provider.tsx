import { retryOnErrorAsync } from "functional-extensions"
import { type DialogHandle, ResultType } from "web-dialog-react"
import type { DirectoryItem, Item, SystemError, Version } from "../../requests/model"
import IconName from "../../components/IconName"
import { IconNameType } from "../../items-provider/items"
import { formatDateTime, formatSize } from "../../items-provider/provider"
import { addNetworkShare } from "../../requests/requests"
import Credentials, { type CredentialsProps } from "../../components/dialogs/Credentials"

export const windowsAppendPath = (path: string, subPath: string) => {
    return path.endsWith("\\") || subPath.startsWith('\\')
        ? path + subPath    
        : path + "\\" + subPath
}

export const windowsGetColumns = () => [
        { name: "Name", isSortable: true, subColumn: "Erw." },
        { name: "Datum", isSortable: true },
        { name: "Größe", isSortable: true, isRightAligned: true },
        { name: "Version", isSortable: true }        
    ]

export const windowsRenderRow = (item: Item) => [
	(<IconName namePart={item.name} type={
			item.isParent
			? IconNameType.Parent
			: item.isDirectory
			? IconNameType.Folder
			: IconNameType.File}
		iconPath={(item as DirectoryItem).iconPath} />),
    (<span className={(item as DirectoryItem).exifData?.dateTime ? "exif" : ""} >
        {formatDateTime((item as DirectoryItem)?.exifData?.dateTime ?? (item as DirectoryItem)?.time)}
    </span>),
	formatSize(item.size),
    formatVersion((item as DirectoryItem).fileVersion)
]

export const windowsSortVersion = (item1: Item, item2: Item) => {
    const a = item1 as DirectoryItem
    const b = item2 as DirectoryItem
    return a.fileVersion && !b.fileVersion
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
    }

export const windowsOnGetItemsError = async (e: unknown, share: string, dialog?: DialogHandle, setErrorText?: (msg: string)=>void) => {
    if (!dialog || !setErrorText)
        throw "wrong parameters"
	const se = e as SystemError
    if (se.error != "NOT_MOUNTED" && se.error != "WRONG_CREDENTIALS")
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


export const formatVersion = (version?: Version) => 
    version ? `${version.major}.${version.minor}.${version.build}.${version.patch}` : ""
