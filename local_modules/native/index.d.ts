import {DriveItem } from "../../src/main/drives"

declare module 'native' {

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
}