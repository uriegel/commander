import { DialogBox, Result } from 'web-dialog-box'
import { forceClosing } from './commander'
import { CopyConflicts } from './components/copyconflicts'
import { FolderItem, getSelectedItemsOverview } from './components/folder'
import { ActionType, ConflictItem, EngineType, GetActionTextResult, IOError, IOErrorResult, Nothing, request } from './requests'

const dialog = document.querySelector('dialog-box') as DialogBox    

// TODO Copy/Move Conflicts: Version

export async function copyItems(
    folderId: string,
    checkResult: (error: IOError) => any,
    move: boolean,
    fromLeft: boolean,
    sourceEngineType: EngineType,
    targetEngineType: EngineType,
    sourcePath: string,
    targetPath: string,
    items: FolderItem[]) {
    const [dirs, files] = getSelectedItemsOverview(items)
    if (dirs + files == 0)
        return

    let conflicts = await request<ConflictItem[]>("preparecopy", {
        folderId, 
        sourceEngineType,
        sourcePath, 
        targetEngineType,
        targetPath, 
        items: items.map(n => n.name)
    })

    let texts = await request<GetActionTextResult>("getactionstexts", {
        engineType:      sourceEngineType,
        otherEngineType: targetEngineType,
        type: move ? ActionType.Move : ActionType.Copy,
        dirs,
        files,
        conflicts: conflicts.length > 0
    })
    if (!texts.result) {
        await request<Nothing>('postcopyitems', {
            sourceEngineType,
            targetEngineType
        })
        return
    }

    const settings = conflicts.length == 0
    ? {
        text: texts.result,
        slide: fromLeft,
        slideReverse: !fromLeft,
        btnCancel: true,
        btnOk: true,
        defBtnOk: true
    }
    : {
        text: texts.result,
        slide: fromLeft,
        slideReverse: !fromLeft,
        btnCancel: true,
        extended: "copy-conflicts",
        btnYes: true,
        btnNo: true,
        fullscreen: true,
        defBtnNo: true
    }

    if (conflicts.length > 0) {
        const copyConflicts = document.getElementById('copy-conflicts') as CopyConflicts
        copyConflicts.setItems(conflicts)
    }

    const res = await dialog.show(settings)
    if (res.result == Result.No) {
        items = items.filter(n => conflicts.find(e => e.conflict == n.name) == undefined)
        if (items.length == 0) {
            await request<Nothing>('postcopyitems', {
                sourceEngineType,
                targetEngineType
            })
            return
        }
    }

    if (res.result == Result.Ok || res.result == Result.No || res.result == Result.Yes) {
        showProgress()

        const ioResult = await request<IOErrorResult>("copyitems", {
            folderId,
            sourcePath,
            sourceEngineType,
            targetEngineType,
            move,
            conflictsExcluded: res.result == Result.No
        })

        dialog.closeDialog(Result.Ok)

        if (closeApp) {
            forceClosing()
            window.close()
        }

        checkResult(ioResult.error) 
        
        async function showProgress() {
            isCopying = true
            let res = await dialog.show({
                text: move ? "Fortschritt beim Verschieben" : "Fortschritt beim Kopieren",
                slideReverse: !fromLeft,
                extended: "copy-progress",
                btnCancel: true
            })
            if (res.result == Result.Cancel) {
                request<Nothing>('cancelcopy', {
                    sourceEngineType,
                    targetEngineType
                })
                await dialog.show({
                    text: "Vorgang wird abgebrochen...",
                    slideReverse: !fromLeft
                })
            }         
            isCopying = false
        }
    
        await request<Nothing>('postcopyitems', {
            sourceEngineType,
            targetEngineType
        })
    }
}

export function wantClose() {
    closeApp = true
    if (isCopying) {
        dialog.closeDialog(Result.Cancel)
        return false
    } else
        return true
}

var isCopying = false
var closeApp = false