export type NullData = {}

export type GetFilesInput = {
    folderId: string,
    requestId: number,
    path: string,
    showHidden?: boolean
}

export type CancelExifsInput = {
    requestId: string
}

export type GetItemsFinishedInput = {
    folderId: string
}

export type CmdInput = {
    cmd: string
}

export type GetItemsOutput = {
    items: Item[],
    path: string,
    dirCount: number,
    fileCount: number
}

export type GetAccentColorOutput = {
    color: string
}

interface SelectableItem {
    isSelected?: boolean
}

export interface Item extends SelectableItem {
    name:         string
    idx?:         number
    size?:        number
    isParent?:    boolean
    isDirectory?: boolean    
}

type DriveType = 'HOME' | "REMOVABLE" | "HARDDRIVE"

export interface RootItem extends Item {
    description?:  string
    mountPoint?:   string
    isMounted?:    boolean
    type?:         DriveType
    //    driveKind?:    DriveKind    
}

export interface DirectoryItem extends Item {
    iconPath?:      string
    time?:          string
    exifData?:      ExifData
    isHidden?:      boolean
    fileVersion?:   VersionInfo
}

export interface ExifData {
    dateTime?: string
    latitude?: number
    longitude?: number
}

export type VersionInfo = {
    major: number,
    minor: number,
    build: number,
    patch: number
}


