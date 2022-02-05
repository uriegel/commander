declare module 'rust-addon' 
export function copyFiles(source: string, target: string , overwrite: boolean): Promise<void>
export function toRecycleBin(source: string)
export function getIcon(ext: string): string
export function getIconAsync(ext: string): Promise<Buffer>
/**
 * Creates a folder (only for Windows)
 */
export function createDirectory(path: string): Promise<void>
export function getFiles(path: string): FileItem[]

export type FileItem = {
    name: string,
    isHidden: boolean,
    isDirectory: boolean,
    size: number,
    time: Date
}
