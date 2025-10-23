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

export type CopyProgress = {
    idx: number,
    currentBytes: number,
    currentMaxBytes: number,
    totalBytes: number,
    totalMaxBytes: number,
}

export type EventData = ExifData | ExifStatus | CopyProgress

export type EventCmd = "Exif" | "ExifStart" | "ExifStop" | "CopyProgress"

export type Event = {
    folderId?: string,
    cmd: EventCmd,
    msg: EventData
}