import path from 'path'
import type * as RustAddonType from 'rust'
import { createRequire } from 'module'
import { sendEvent } from './index.js'
const require = createRequire(import.meta.url)
const addon = require('rust') as typeof RustAddonType

export async function retrieveExifDatas(folderId: string, requestId: number, itemsResult: RustAddonType.FileItemsResult) {
    const exifDatas = await itemsResult
        .items
        .filter(n => n.name.toLowerCase().endsWith(".jpg") || n.name.toLowerCase().endsWith(".png") || n.name.toLowerCase().endsWith(".heic"))
        .map(n => ({ idx: n.idx, path: path.join(itemsResult.path, n.name) }))
        .toAsyncEnumerable()
        .mapAwait(addon.getExifDataAsync)
        .filter(n => !!n.dateTime || !!n.latitude || !!n.longitude)
        .await()
    if (exifDatas.length > 0)
        sendEvent({
            folderId,
            cmd: 'Exif',
            msg: {
                requestId,
                items: exifDatas
            }
        })
}