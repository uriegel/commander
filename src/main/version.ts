import path from 'path'
import { FileItemsResult, getVersionInfos } from "filesystem-utilities"
import { sendEvent } from './index.js'
import { getItemsSemaphores } from './requests.js'

export async function retrieveVersions(folderId: string, requestId: string, itemsResult: FileItemsResult) {
    const input = itemsResult
        .items
        .filter(n => n.name.toLowerCase().endsWith(".exe") || n.name.toLowerCase().endsWith(".dll"))
        .map(n => ({ idx: n.idx, path: path.join(itemsResult.path, n.name) }))
    
    if (input.length) {
        await getItemsSemaphores.get(folderId)?.wait()
        sendEvent({ folderId, cmd: 'VersionsStart', msg: { requestId } })

        const versions = await getVersionInfos(input, `${folderId}-${requestId}`)
        if (versions.length > 0)
            sendEvent({
                folderId, cmd: 'Versions', msg: {
                    requestId,
                    items: versions
                }
            })
        sendEvent({ folderId, cmd: 'VersionsStop', msg: { requestId } })
    }
}