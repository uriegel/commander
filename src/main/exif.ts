import path from 'path'
import type * as RustAddonType from 'rust'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const addon = require('rust') as typeof RustAddonType

export async function retrieveExifDatas(itemsResult: RustAddonType.FileItemsResult) {
    const exifDatas = await itemsResult
        .items
        .filter(n => n.name.toLowerCase().endsWith(".jpg") || n.name.toLowerCase().endsWith(".png") || n.name.toLowerCase().endsWith(".heic"))
        .map(n => path.join(itemsResult.path, n.name))
        .toAsyncEnumerable()
        .mapAwait(addon.getExifDataAsync)
        .await()

    console.log("ExifDatas", exifDatas)
}