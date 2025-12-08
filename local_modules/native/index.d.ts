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
}