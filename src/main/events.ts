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

export type ExifStatus = {
    requestId: number
}

export type EventData = ExifData | ExifStatus

export type EventCmd = "Exif" | "ExifStart" | "ExifStop"

export type Event = {
    folderId?: string,
    cmd: EventCmd,
    msg: EventData
}