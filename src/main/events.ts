import { VersionInfoResult } from "filesystem-utilities"

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

export type Version = {
    requestId: number,
    items: VersionInfoResult
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
    move?: boolean,
    items?: string[]
}

export type NullData = {}

export type EventData = ExifData | ExifStatus | CopyProgress | NullData | Version

export type EventCmd = "Exif" | "ExifStart" | "ExifStop" | "CopyStop" |"CopyProgress"
                     | "CopyProgressShowDialog" | "VersionsStart" |"VersionsStop" |"Versions"

export type Event = {
    folderId?: string,
    cmd: EventCmd,
    msg: EventData
}