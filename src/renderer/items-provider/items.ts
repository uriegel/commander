import { DirectoryItem, Item } from "../requests/model"

export interface ExtendedRenameFileItem extends DirectoryItem {
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


