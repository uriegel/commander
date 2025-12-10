import { VersionInfoResult } from "native"

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

export type DeleteProgress = {
    idx: number,
    totalCount: number,
    items?: string[]
}

export type NullData = {}

export type EventData = ExifData | ExifStatus | CopyProgress | NullData | Version

export type EventCmd = "Exif" | "ExifStart" | "ExifStop" | "CopyStop" | "CopyProgress" | "CopyProgressShowDialog" |
                        "VersionsStart" | "VersionsStop" | "Versions" | "ThemeChanged" | "DeleteProgress" | "DeleteStop"

export type Event = {
    folderId?: string,
    cmd: EventCmd,
    msg: EventData
}