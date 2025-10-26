import { DialogHandle, ResultType } from "web-dialog-react"
import { EnterData, IItemsProvider, OnEnterResult } from "./base-provider"
import ExtendedRename, { ExtendedRenameProps } from "../components/dialogs/ExtendedRename"
import { FileItemProvider, getRowClasses } from "./file-item-provider"
import { TableColumns } from "virtual-table-react"
import IconName from "../components/IconName"
import { ExtendedRenameFileItem, IconNameType, Item } from "./items"
import { formatDateTime, formatSize } from "./provider"

export const EXTENDED_RENAME = "EXTENDED_RENAME"

export const showExtendedRename = async (currentItemsProvider: IItemsProvider|undefined, dialog: DialogHandle) => {

     let extendedRenameProps = getExtendedRenameProps()

     const onExtendedRenameChanged = (val: ExtendedRenameProps) => {
          extendedRenameProps = val
          localStorage.setItem("extendedRenameProps", JSON.stringify(val))
     }

     const res = await dialog.show({
          text: "Erweitertes Umbenennen",
          extension: ExtendedRename,
          extensionProps: extendedRenameProps,
          onExtensionChanged: onExtendedRenameChanged,
          btnOk: true,
          btnCancel: true,
          defBtnOk: true
     })

     return (res.result == ResultType.Ok && currentItemsProvider?.getId() != EXTENDED_RENAME)
          ? new ExtendedRenameProvider()
          : (res.result != ResultType.Ok && (currentItemsProvider?.getId() == EXTENDED_RENAME))
          ? new FileItemProvider()
          : null    
}

export class ExtendedRenameProvider extends FileItemProvider {
     getId() { return EXTENDED_RENAME }

     getColumns(): TableColumns<Item> {
         return {
               columns: [
                    { name: "Name", isSortable: true, subColumn: "Erw." },
                    { name: "Neuer Name" },
                    { name: "Datum", isSortable: true },
                    { name: "Größe", isSortable: true, isRightAligned: true }
               ],
               getRowClasses,
               renderRow
          }
     }

     onSelectionChanged(items: ExtendedRenameFileItem[]) { 
          const props = getExtendedRenameProps()
          items.reduce((p, n) => {
               n.newName = n.isSelected && !n.isDirectory
                    ? `${props.prefix}${p.toString().padStart(props.digits, '0')}.${n.name.split('.').pop()}`
                    : undefined
               return p + (n.isSelected && !n.isDirectory ? 1 : 0)
          }, props.startNumber)
     }     

    sort(items: ExtendedRenameFileItem[], sortIndex: number, sortDescending: boolean) {
        const sorted = super.sort(items, sortIndex == 0 ? 0 : sortIndex - 1, sortDescending)
        this.onSelectionChanged(sorted)
        return sorted
     }
     
     async onEnter(enterData: EnterData): Promise<OnEnterResult> {
          return enterData.id && enterData.dialog && enterData.selectedItems?.find(n => (n as ExtendedRenameFileItem).newName)
          ? this.onRename(enterData.id, enterData.path, enterData.selectedItems, enterData.dialog)
          : super.onEnter(enterData)
     }     

     async onRename(id: string, path: string, items: ExtendedRenameFileItem[], dialog: DialogHandle) {
          const res = await dialog.show({
               text: "Umbenennungen starten?",
               btnOk: true,
               btnCancel: true
          })
          return (res.result == ResultType.Ok)
               ? {
                    processed: true,
                    //refresh: (await onExtendedRename({ id, path, items })).success 
               }
               : {
                    processed: true,
               }
     }
}

const renderRow = (item: ExtendedRenameFileItem) => [
	(<IconName namePart={item.name} type={
			item.isParent
			? IconNameType.Parent
			: item.isDirectory
			? IconNameType.Folder
			: IconNameType.File}
          iconPath={item.iconPath} />),
     item.newName ?? "",
	(<span className={item.exifData?.dateTime ? "exif" : "" } >{formatDateTime(item?.exifData?.dateTime ?? item?.time)}</span>),
	formatSize(item.size)
]

const getExtendedRenameProps = () => JSON.parse(localStorage.getItem("extendedRenameProps") ?? JSON.stringify({
     digits: 3,
     prefix: "Bild",
     startNumber: 1
} as ExtendedRenameProps)) as ExtendedRenameProps
