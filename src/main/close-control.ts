import { powerSaveBlocker } from 'electron'

let blockerId: number|null = null

export const canClose = () => closePrevent != true
export const setClosePrevent = (prevent: boolean) => {
    if (prevent && (blockerId == null || !powerSaveBlocker.isStarted(blockerId))) 
        blockerId = powerSaveBlocker.start('prevent-app-suspension')
    if (!prevent && blockerId != null && powerSaveBlocker.isStarted(blockerId)) {
        powerSaveBlocker.stop(blockerId)
        blockerId = null
    }
    closePrevent = prevent
}

let closePrevent = false