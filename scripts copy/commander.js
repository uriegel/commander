import { RESULT_CANCEL, RESULT_OK, RESULT_YES, RESULT_NO } from 'web-dialog-box'
import { initializeCopying } from './processors/copyProcessor.js'
import './components/copyconflicts'
import './components/externaladder'
import './components/extendedrename'

folderLeft.addEventListener("dragAndDrop", evt => copy(evt.detail))
folderRight.addEventListener("dragAndDrop", evt => copy(evt.detail))

async function extendedRename() {
    const extendedRename = document.getElementById("extended-rename")
    extendedRename.initialize()
    const res = await dialog.show({
        extended: "extended-rename",
        btnOk: true,
        btnCancel: true,
        defBtnOk: true
    })    
    activeFolder.setFocus()
    if (res.result == RESULT_OK) {
        extendedRename.save()
        activeFolder.extendedRename = extendedRename.getExtendedInfos()
    }
}








