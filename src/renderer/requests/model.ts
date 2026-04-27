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

export type MountInput = {
    device: string
}

export type CmdInput = {
    cmd: string
}

export type CreateFolderInput = {
    path: string,
    item: string
}

export type DeleteInput = {
    path: string,
    items: string[]
}

export type FlattenItemInput = {
    path: string,
    targetPath: string,
    items: CopyItem[]
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

export type MountOutput = {
    path: string
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
    fileVersion?:   Version
}

export type Version = {
    major: number,
    minor: number,
    build: number,
    patch: number
}

export type CopyItem = {
    name:           string
    isDirectory?:   boolean    
    iconPath?:      string
    time?:          string
    size?:          number
    targetTime?:    string
    targetSize?:    number
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

type EventData = ExtendedInfos | CopyProgress | Version | DeleteProgress | ThemeChangeEvent | WindowStateEvent | ShowHiddenEvent | ShowViewerEvent | PreviewModeEvent | CmdEvent

type EventCmd = "ExtendedInfos" | "ExtendedInfosStart" | "ExtendedInfosStop" | "CopyProgress" | "CopyStop" | "CopyProgressShowDialog"
            | "ThemeChanged" | "DeleteProgress" | "DeleteStop" | "WindowState" | "ShowHidden" | "ShowViewer" | "PreviewMode" | "Cmd"

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
    versions?: VersionInfo[]
}

export type ExtendedInfosStatus = {
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

export type VersionInfo = {
    idx: number,
    version: Version
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

export type ShowViewerEvent = {
    showViewer?: boolean
}

type PreviewMode = "IMAGE" | "LOCATION" | "IMAGE_LOCATION"

export type PreviewModeEvent = {
    previewMode: PreviewMode
}

export type CmdEvent = {
    cmd: string
}

export type GpxPoint = {
    latitude: number
    longitude: number
    elevation: number
    time: string
    heartrate: number
    velocity: number
}

export type GpxTrack = {
    name: string
    distance: number
    duration: number
//    date: string
    averageSpeed: number
    trackPoints: GpxPoint[]
}    
