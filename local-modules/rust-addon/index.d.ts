declare module 'rust-addon' 
export function copyFiles(source: string, target: string , overwrite: boolean) : Promise<void>
export function toRecycleBin(source: string) 