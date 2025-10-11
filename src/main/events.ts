import type * as RustAddonType from 'rust'

export type ExifData = {
    requestId: number,
    items: RustAddonType.ExifData[]
}

export type EventData = ExifData

export type EventCmd = "Exif"

export type Event = {
    folderId?: string,
    cmd: EventCmd,
    msg: EventData
}