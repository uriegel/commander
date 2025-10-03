interface SelectableItem {
    isSelected?: boolean
}

export interface Item extends SelectableItem {
    name:         string
    size?:        number
    isParent?:    boolean
    isDirectory?: boolean    
}

interface RootItem extends Item {
    description?:  string
    mountPoint?:   string
    isMounted?:    boolean
    isEjectable?:  boolean
    //    driveKind?:    DriveKind    
}

interface FileItem extends Item {
    time?:      string
//    exifData?: ExifData
    isHidden?:  boolean
}

interface RemotesItem extends Item {
    ipAddress?: string
    isAndroid?: boolean
    isNew?:     boolean
}

interface ExtendedRenameItem extends Item {
    kind:       3
    newName?:   string 
}

interface FavoritesItem extends Item {
    kind:   4
    path?:  string
}

const affe = (item: Item) => {
    const test = item.name
    const root = (item as RootItem).mountPoint
}