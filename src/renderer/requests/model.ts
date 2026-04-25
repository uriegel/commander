// eslint-disable-next-line @typescript-eslint/no-empty-object-type      
export type NullData = {}

export type GetFilesInput = {
    folderId: string,
    requestId: number,
    path: string,
    showHidden?: boolean
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

export type VersionInfo = {
    major: number,
    minor: number,
    build: number,
    patch: number
}


type UNKNOWN = "UNKNOWN"
type ACCESS_DENIED = "ACCESS_DENIED"
type PATH_NOT_FOUND = "PATH_NOT_FOUND"
type TRASH_NOT_POSSIBLE = "TRASH_NOT_POSSIBLE"
type CANCELLED = "CANCELLED"
type FILE_EXISTS = "FILE_EXISTS"
type WRONG_CREDENTIALS = "WRONG_CREDENTIALS"
type NETWORK_NAME_NOT_FOUND = "NETWORK_NAME_NOT_FOUND"
type NETWORK_PATH_NOT_FOUND = "NETWORK_PATH_NOT_FOUND"

export type ErrorType = ACCESS_DENIED | PATH_NOT_FOUND | TRASH_NOT_POSSIBLE | CANCELLED 
                        | FILE_EXISTS | WRONG_CREDENTIALS | NETWORK_NAME_NOT_FOUND
                        | NETWORK_PATH_NOT_FOUND | UNKNOWN

export type SystemError = {
    error: ErrorType,
    message: string
}

type EventData = ExtendedInfos | ExifStatus| CopyProgress | Version | DeleteProgress | ThemeChangeEvent | WindowStateEvent | ShowHiddenEvent

type EventCmd = "ExtendedInfos" | "ExifStart" | "ExifStop" | "CopyProgress" | "CopyStop" | "CopyProgressShowDialog"
    | "VersionsStart" | "VersionsStop" | "Versions" | "ThemeChanged" | "DeleteProgress" | "DeleteStop" | "WindowState" | "ShowHidden"

export type CommanderEvent = {
    folderId?: string,
    cmd: EventCmd,
    msg: EventData
}

export type ExifData = {
    idx?: number,
    dateTime?: string,
    latitude?: number,
    longitude?: number
}

export type ExtendedInfos = {
    requestId: number,
    exifs?: ExifData[]
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

export type Version = {
    requestId: number,
    //items: VersionInfoResult[]
}

export type ThemeChangeEvent = {
    accentColor: string
}

export type WindowStateEvent = {
    maximized: boolean
}

export type ShowHiddenEvent = {
    showHidden?: boolean
}
