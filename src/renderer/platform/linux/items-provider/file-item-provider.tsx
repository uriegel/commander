import IconName from "@/renderer/components/IconName"
import { FileItem, IconNameType } from "@/renderer/items-provider/items"
import { formatDateTime, formatSize } from "@/renderer/items-provider/provider"
import { DialogHandle } from "web-dialog-react"

export const appendPath = (path: string, subPath: string) => {
    return path.endsWith("/") || subPath.startsWith('/')
        ? path + subPath
        : path + "/" + subPath
}

export const getColumns = () => [
        { name: "Name", isSortable: true, subColumn: "Erw." },
        { name: "Datum", isSortable: true },
        { name: "Größe", isSortable: true, isRightAligned: true }
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
	formatSize(item.size)
]

export const onGetItemsError = async (e: unknown, _share: string, _dialog?: DialogHandle, _setErrorText?: (msg: string)=>void) => {
	throw e
}

export const sortVersion = () => 0
