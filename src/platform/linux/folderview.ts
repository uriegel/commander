import { type DialogHandle, ResultType } from "web-dialog-react"
import type { OpenWithProps } from "../../components/dialogs/OpenWith"
import OpenWith from "../../components/dialogs/OpenWith"
import { openFile } from "../../requests/requests"

export const linuxOpenWith = async (name: string, path: string, dialog: DialogHandle) => {
    
    const extensionProps = { fileName: name, filePath: path } as OpenWithProps
    const res = await dialog.show({
        text: 'Datei öffnen',
        extension: OpenWith,
        extensionProps,
        onExtensionChanged: (prop: OpenWithProps) => extensionProps.app = prop.app,
        btnCancel: true,
        defBtnOk: true,
        btnOk: true
    })
    if (res.result == ResultType.Ok && extensionProps.app?.executable)
        await openFile(extensionProps.app.executable, `${path}/${name}`)
}