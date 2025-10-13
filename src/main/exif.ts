import path from 'path'
import { sendEvent } from './index.js'
import { FileItemsResult, getExifInfosAsync } from 'filesystem-utilities'

export async function retrieveExifDatas(folderId: string, requestId: number, itemsResult: FileItemsResult) {
    const input = itemsResult
        .items
        .filter(n => n.name.toLowerCase().endsWith(".jpg") || n.name.toLowerCase().endsWith(".png") || n.name.toLowerCase().endsWith(".heic"))
        .map(n => ({ idx: n.idx, path: path.join(itemsResult.path, n.name) }))
    
    if (input.length) {
        sendEvent({ folderId, cmd: 'ExifStart', msg: { requestId } })

        const exifDatas = await getExifInfosAsync(input, `${requestId}`)
        if (exifDatas.length > 0)
            sendEvent({
                folderId, cmd: 'Exif', msg: {
                    requestId,
                    items: exifDatas.map(n => ({ idx: n.idx, dateTime: n.date.toISOString(), latitude: n.latitude, longitude: n.longitude }))
                }
            })
        sendEvent({ folderId, cmd: 'ExifStop', msg: { requestId } })
    }
}