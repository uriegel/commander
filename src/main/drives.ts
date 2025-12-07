import { exec } from "child_process"
import { homedir } from 'os'

export type UNKNOWN = "UNKNOWN"
export type HARDDRIVE = "HARDDRIVE"
export type ROM = "ROM"
export type REMOVABLE = "REMOVABLE"
export type NETWORK = "NETWORK"
export type HOME = "HOME"

export type DriveType = UNKNOWN | HARDDRIVE | ROM | REMOVABLE | NETWORK | HOME

export interface DriveItem {
    name: string
    description: string
    size?: number
    type: DriveType 
    mountPoint?: string
    driveType?: string
    isMounted?: boolean
}

interface InnerDriveItem extends DriveItem {
    isRoot: boolean
}

export const getDrives = async () => {
    const drivesString = (await runCmd('lsblk --bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE')) as string
    const driveStrings = drivesString.split("\n")
    const columnsPositions = (() => {
        const title = driveStrings[0]
        const getPart = (key: string) => title.indexOf(key)

        return [
            0,
            getPart("NAME"),
            getPart("LABEL"),
            getPart("MOUNT"),
            getPart("FSTYPE")
        ]
    })()

    //const takeOr = (text: string, alt: string) => text ? text : alt
    const constructDrive = (driveString: string) => {
        const getString = (pos1: number, pos2: number) =>
            driveString.substring(columnsPositions[pos1], columnsPositions[pos2]).trim()
        const trimName = (name: string) =>
            name.length > 2 && name[1] == '─'
                ? name.substring(2)
                : name
        const mount = getString(3, 4)
        
        return {
            description: getString(2, 3),
            name: trimName(getString(1, 2)),
            type: "HARDDRIVE", // TODO: Drive types enum DriveType
            mountPoint: mount,
            isMounted: !!mount,
            driveType: driveString.substring(columnsPositions[4]).trim(),
            size: parseInt(getString(0, 1), 10),
            isRoot: driveString[columnsPositions[1]] < '~'
        } as InnerDriveItem
    }

    const itemOffers = [{ name: "~", description: "home", mountPoint: homedir(), isMounted: true, type: "HOME", isRoot: false } as InnerDriveItem]
        .concat(driveStrings
            .slice(1)
            .map(constructDrive)
    )
    const items = itemOffers
                    .filter(rio => (!rio.isRoot && rio.name) || (itemOffers.filter(n => n.name != rio.name && n.name.startsWith(rio.name)).length == 0
                        && rio.mountPoint != "[SWAP]"
                        && !rio.mountPoint?.startsWith("/snap")))
        .map(n => ({
            description: n.description, name: n.name, type: n.type, mountPoint: n.mountPoint, isMounted: n.isMounted, driveType: n.driveType, size: n.size
        }))
    
    const mounted = items.filter(n => n.isMounted)
    const unmounted = items.filter(n => !n.isMounted)
    return mounted.concat(unmounted)
}    

const runCmd = (cmd: string) => new Promise(res => exec(cmd, (_, stdout) => res(stdout)))
