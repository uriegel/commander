export type ExifDataInfo = {
    idx: number,
    dateTime?: string,
    latitude?: number,
    longitude?: number
}


export type ExifData = {
    requestId: number,
    items: ExifDataInfo[]
}

export type EventData = ExifData

export type EventCmd = "Exif"

export type Event = {
    folderId?: string,
    cmd: EventCmd,
    msg: EventData
}