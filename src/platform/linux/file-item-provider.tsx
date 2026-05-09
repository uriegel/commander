import IconName from "@/components/IconName"
import { IconNameType } from "@/items-provider/items"
import { formatDateTime, formatSize } from "@/items-provider/provider"
import { DirectoryItem } from "@/requests/model"
import { DialogHandle } from "web-dialog-react"

export const linuxAppendPath = (path: string, subPath: string) => {
    return path.endsWith("/") || subPath.startsWith('/')
        ? path + subPath
        : path + "/" + subPath
}

export const linuxGetColumns = () => [
        { name: "Name", isSortable: true, subColumn: "Erw." },
        { name: "Datum", isSortable: true },
        { name: "Größe", isSortable: true, isRightAligned: true }
    ]

export const linuxRenderRow = (item: DirectoryItem) => [
	(<IconName namePart={item.name} type={
			item.isParent
			? IconNameType.Parent
			: item.isDirectory
			? IconNameType.Folder
			: IconNameType.File}
		iconPath={item.iconPath} />),
	(<span className={item.exifData?.dateTime ? "exif" : "" } >{formatDateTime(item?.exifData?.dateTime ?? item?.time)}</span>),
	formatSize(item.size)
]

export const linuxOnGetItemsError = async (e: unknown, _share: string, _dialog?: DialogHandle, _setErrorText?: (msg: string)=>void) => {
	throw e
}

export const linuxSortVersion = () => 0
