import { DriveType } from "filesystem-utilities"

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

export interface RootItem extends Item {
    description?:  string
    mountPoint?:   string
    isMounted?:    boolean
    type?:         DriveType
    //    driveKind?:    DriveKind    
}

export interface ExifData {
    dateTime?: string
    latitude?: number
    longitude?: number
}

export interface FileItem extends Item {
    iconPath?:  string
    time?:      string
    exifData?:  ExifData
    isHidden?:  boolean
}

export interface ExtendedRenameFileItem extends FileItem {
    newName?:   string
}

export interface RemotesItem extends Item {
    ipAddress?: string
    isAndroid?: boolean
    isNew?:     boolean
}

export interface ExtendedRenameItem extends Item {
    newName?:   string 
}

export interface FavoriteItem extends Item {
    isNew?: boolean
    path?:  string
}

export interface ItemsResult {
    requestId: number
    items?: Item[]
    dirCount: number,
    fileCount: number,
    path?: string,
    cancelled?: boolean
}

export const IconNameType = {
    Parent: 'Parent',
    Root: 'Root',
    RootEjectable: 'RootEjectable',
    RootWindows: 'RootWindows',
    Home: 'Home',
    Folder: 'Folder',
    File: 'File',
    Remote: 'Remote',
    Android: 'Android',
    New: 'New',
    Service: 'Service',
    Favorite: 'Favorite'
}
export type IconNameType = (typeof IconNameType)[keyof typeof IconNameType]


