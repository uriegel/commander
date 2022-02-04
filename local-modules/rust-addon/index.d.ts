declare module 'rust-addon' 
export function copyFiles(source: string, target: string , overwrite: boolean): Promise<void>
export function toRecycleBin(source: string)
export function getIcon(ext: string): string
export function getIconAsync(ext: string): Promise<Buffer>