import {DriveItem } from "../../src/main/drives"

declare module 'native' {
    export type UNKNOWN = "UNKNOWN"
    export type ACCESS_DENIED = "ACCESS_DENIED"
    export type PATH_NOT_FOUND = "PATH_NOT_FOUND"
    export type TRASH_NOT_POSSIBLE = "TRASH_NOT_POSSIBLE"
    export type CANCELLED = "CANCELLED"
    export type FILE_EXISTS = "FILE_EXISTS"
    export type WRONG_CREDENTIALS = "WRONG_CREDENTIALS"
    export type NETWORK_NAME_NOT_FOUND = "NETWORK_NAME_NOT_FOUND"
    export type NETWORK_PATH_NOT_FOUND = "NETWORK_PATH_NOT_FOUND"

    export type ErrorType = ACCESS_DENIED | PATH_NOT_FOUND | TRASH_NOT_POSSIBLE | CANCELLED 
                            | FILE_EXISTS | WRONG_CREDENTIALS | NETWORK_NAME_NOT_FOUND
                            | NETWORK_PATH_NOT_FOUND | UNKNOWN

    export interface SystemError {
        error: ErrorType,
        nativeError: number,
        message: string
    }

    export interface FileItem {
        name: string
        idx: number
        isDirectory: boolean
        isHidden?: boolean  
        size?: number 
        time?: Date
    }

    export interface FileItemsResult {
        items: FileItem[]
        dirCount: number  
        fileCount: number
        path: string
    }

    export interface ExifInfosInput {
        path: string,
        idx: number
    }

    export interface ExifInfo {
        idx: number,
        date: Date,
        latitude: number,
        longitude: number
    }

    /**
     * Retrieves all files from a directory. 
     * @param path parent directory containing directories and files to be retrieved
     * @param showHidden When 'true', retrieves hidden files too
     * @throws SystemError
     */
    function getFiles(path: string, showHidden?: boolean): Promise<FileItem[]>

    /**
     * Retrieves all drives from the file system
     * @returns drives 
     */
    function getDrives(): Promise<DriveItem[]>

    /**
     * Gets the Gnome (or Ubuntu) accent color as string
     */
    function getAccentColor(): string

    /**
     * Retrieves system icon in 16x16, as png or svg for dedicated file extensions
     * @param ext The file extension to retrieve the icon for. like '.mp4'
     * @result The icon as binary data
     */
    function getIcon(ext: string): Promise<Buffer>
    
    /**
     * Retrieves icon in 16x16, as png or svg for a special name. 
     * On linux these are the names GTK can look up an deliver.
     * On Windows only specific names are supported:
     *  * 'drive-removable-media'
     *  * 'media-removable'
     *  * 'drive-windows'
     *  * 'folder-open'
     *  * 'user-home'
     *  * 'go-up'
     *  * 'network-server'
     *  * 'starred'
     *  * 'android'
     * @result The icon as binary data
     */
    function getIconFromName(name: string): Promise<Buffer>

    /**
     * 
     * Retrieves the exif datas of a png or jpg file, if included
     * @param file Pathes to the png or jpg files, together with an index.
     * @param cancellation When included as string, the operation can be cancelled by calling function 'cancel' with this string as parameter
     * @returns An array of exif informations. Each entry belongs to the file path entry with the same index
     */
    function getExifInfos(files: ExifInfosInput[], cancellation?: string): Promise<ExifInfo[]>
}