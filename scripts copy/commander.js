import { RESULT_CANCEL, RESULT_OK, RESULT_YES, RESULT_NO } from 'web-dialog-box'
import { initializeCopying } from './processors/copyProcessor.js'
import './components/copyconflicts'
import './components/externaladder'
import './components/extendedrename'
export const DIRECTORY = 1
export const FILE = 2
export const BOTH = 3


function getItemsTypes(selectedItems) {
    const types = selectedItems
        .map(n => n.isDirectory)
        .filter((item, index, resultList) => resultList
            .findIndex(n => n == item) == index)
    return types.length == 1
    ? types[0] ? DIRECTORY : FILE
    : BOTH
}

initializeCopying(onCopyFinish, onShowCopyErrors)




folderLeft.addEventListener("delete", evt => onDelete(evt.detail))
folderRight.addEventListener("delete", evt => onDelete(evt.detail))
folderLeft.addEventListener("dragAndDrop", evt => copy(evt.detail))
folderRight.addEventListener("dragAndDrop", evt => copy(evt.detail))

async function copy(move) {
    const itemsToCopy = activeFolder.selectedItems
    const fromLeft = activeFolder == folderLeft
    const itemsType = getItemsTypes(itemsToCopy)    
    
    const inactiveFolder = getInactiveFolder()
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

async function rename() {
    try {
        if (activeFolder.isExtendedRename) {
            activeFolder.doExtendedRename()
            return
        }

        const selectedItems = activeFolder.getSelectedItems()
        if (selectedItems.length != 1)    
            return
        const itemsType = getItemsTypes(selectedItems)
        const itemToRename = selectedItems[0].name
        const text = itemsType == FILE 
            ? "Datei umbenennen"
            : "Ordner umbenennen"
        
        const getInputRange = () => {
            const pos = itemToRename.lastIndexOf(".")
            if (pos == -1)
                return [0, itemToRename.length]
            else
                return [0, pos]
        }

        const res = await dialog.show({
            text,
            input: true,
            inputText: itemToRename,
            inputSelectRange: getInputRange(),
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })    
        activeFolder.setFocus()
        if (res.result == RESULT_OK)
            await activeFolder.renameItem(itemToRename, res.input)
    } catch (e) {
        const text = e.fileResult == FileResult.AccessDenied
                ? "Zugriff verweigert"
                : "Die Aktion konnte nicht ausgeführt werden"
        setTimeout(async () => {
            await dialog.show({
                text,
                btnOk: true
            })
            activeFolder.setFocus()        
        },
        500)
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

async function onDelete(itemsToDelete) {
    try {
        const itemsType = getItemsTypes(itemsToDelete)
        const text = itemsType == FILE 
            ? itemsToDelete.length == 1 
                ? "Möchtest Du die Datei löschen?"
                : "Möchtest Du die Dateien löschen?"
            : itemsType == DIRECTORY
            ?  itemsToDelete.length == 1 
                ? "Möchtest Du den Ordner löschen?"
                : "Möchtest Du die Ordner löschen?"
            : "Möchtest Du die Einträge löschen?"

        const res = await dialog.show({
            text,
            btnOk: true,
            btnCancel: true
        })    
        activeFolder.setFocus()
        if (res.result == RESULT_OK)
            await activeFolder.deleteItems(itemsToDelete.map(n => n.name))
    } catch (e) {
        const text = e.fileResult == FileResult.AccessDenied
                ? "Zugriff verweigert"
                : e.fileResult == FileResult.TrashNotPossible
                ? "Löschen in den Papierkorb nicht möglich"
                : "Die Aktion konnte nicht ausgeführt werden"
        setTimeout(async () => {
            await dialog.show({
                text,
                btnOk: true
            })
            activeFolder.setFocus()        
        },
        500)
    }
}

async function createFolder() {
    try {
        const selectedItems = activeFolder.selectedItems
        const res = await dialog.show({
            text: "Neuen Ordner anlegen",
            input: true,
            inputText: selectedItems.length == 1 ? selectedItems[0].name : "",
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        activeFolder.setFocus()
        if (res.result == RESULT_OK)
            await activeFolder.createFolder(res.input)
    } catch (e) {
        const text = e.fileResult == FileResult.FileExists
            ? "Die angegebene Datei existiert bereits"
            : e.fileResult == FileResult.AccessDenied
                ? "Zugriff verweigert"
                : "Die Aktion konnte nicht ausgeführt werden"
        setTimeout(async () => {
            await dialog.show({
                text,
                btnOk: true
            })
            activeFolder.setFocus()        
        },
        500)
    }
}

function onCopyFinish(folderIdsToRefresh) {
    folderIdsToRefresh.forEach(n => refresh(n))
}

async function onShowCopyErrors(errorContent) {
    await dialog.show(errorContent)
    activeFolder.setFocus()
}

var commander = {
    createFolder,
    copy,
    rename,
    extendedRename,
}






