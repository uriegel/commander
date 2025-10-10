interface SelectableItem {
    isSelected?: boolean
}

export interface Item extends SelectableItem {
    name:         string
    size?:        number
    isParent?:    boolean
    isDirectory?: boolean    
}

export interface RootItem extends Item {
    description?:  string
    mountPoint?:   string
    isMounted?:    boolean
    isEjectable?:  boolean
    //    driveKind?:    DriveKind    
}

export interface ExifData {
    dateTime: string
    latitude?: number
    longitude: number
}

export interface FileItem extends Item {
    time?:      string
    exifData?:  ExifData
    isHidden?:  boolean
}

export interface RemotesItem extends Item {
    ipAddress?: string
    isAndroid?: boolean
    isNew?:     boolean
}

export interface ExtendedRenameItem extends Item {
    newName?:   string 
}

export interface FavoritesItem extends Item {
    path?:  string
}

export interface ItemsResult {
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


