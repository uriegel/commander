import { DialogHandle } from "web-dialog-react"
import { IItemsProvider } from "./base-provider"
import ExtendedRename, { ExtendedRenameProps } from "../components/dialogs/ExtendedRename"

export const showExtendedRename = async (currentItemsProvider: IItemsProvider|undefined, dialog: DialogHandle) => {
     const res = await dialog.show({
          text: "Erweitertes Umbenennen",
          extension: ExtendedRename,
          extensionProps: {
               prefix: localStorage.getItem("extendedRenamePrefix") ?? "Bild",
               digits: localStorage.getItem("extendedRenameDigits")?.parseInt() ?? 3,
               startNumber: localStorage.getItem("extendedRenameStartNumber")?.parseInt() ?? 1
          } as ExtendedRenameProps,
          btnOk: true,
          btnCancel: true,
          defBtnOk: true
     })
    // return (res.result == ResultType.Ok && !(currentController instanceof ExtendedRename))
    //     ? new ExtendedRename()
    //     : (res.result != ResultType.Ok && (currentController instanceof ExtendedRename))
    //     ? new Directory()
    //     : null    
}
