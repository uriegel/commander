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
