import { DialogHandle, ResultType } from "web-dialog-react"

export const openWith = async (name: string, path: string, dialog: DialogHandle) => {
    const res = await dialog.show({
        text: 'Datei öffnen',
        // extension: copyConflicts.length ? CopyConflicts : undefined,
        // extensionProps: copyConflicts,
        btnCancel: true,
        defBtnOk: true,
        btnOk: true
    })
    if (res.result == ResultType.Cancel)
        return
}