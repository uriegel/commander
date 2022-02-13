import { RESULT_CANCEL, RESULT_OK, RESULT_YES, RESULT_NO } from 'web-dialog-box'
import { initializeCopying } from './processors/copyProcessor.js'
import './components/copyconflicts'
import './components/externaladder'
import './components/extendedrename'

initializeCopying(onCopyFinish, onShowCopyErrors)


folderLeft.addEventListener("dragAndDrop", evt => copy(evt.detail))
folderRight.addEventListener("dragAndDrop", evt => copy(evt.detail))

async function copy(move) {
    const itemsType = getItemsTypes(itemsToCopy)    
    
    const copyInfo = await inactiveFolder.prepareCopyItems(fromLeft, itemsType, activeFolder.getCurrentPath(), 
    itemsToCopy.map(n => ({name: n.name, isDirectory: n.isDirectory})), move, activeFolder)
    const res = await dialog.show(copyInfo.dialogData)
    activeFolder.setFocus()
    if (res.result != RESULT_CANCEL) {
        if (res.result == RESULT_NO) 
            copyInfo.items = copyInfo.items.filter(n => !copyInfo.conflicts.find(m => m.source.file == n.file))
        await activeFolder.copyItems(copyInfo, move, res.result == RESULT_YES, move ? [activeFolder.id, inactiveFolder.id] : [inactiveFolder.id])
        if (move)
            await activeFolder.deleteEmptyFolders(itemsToCopy.filter(n => n.isDirectory).map(n => n.name), [activeFolder.id, inactiveFolder.id])
    }
}


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

function onCopyFinish(folderIdsToRefresh) {
    folderIdsToRefresh.forEach(n => refresh(n))
}

async function onShowCopyErrors(errorContent) {
    await dialog.show(errorContent)
    activeFolder.setFocus()
}







