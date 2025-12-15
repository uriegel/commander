import OpenWith, { OpenWithProps } from "@/renderer/components/dialogs/OpenWith"
import { DialogHandle, ResultType } from "web-dialog-react"

export const openWith = async (name: string, path: string, dialog: DialogHandle) => {
    const res = await dialog.show({
        text: 'Datei öffnen',
        extension: OpenWith,
        extensionProps: { fileName: name, filePath: path } as OpenWithProps,
        btnCancel: true,
        defBtnOk: true,
        btnOk: true
    })
    if (res.result == ResultType.Cancel)
        return
}